# GoNexus AWS 部署架构说明

这份文档用于理解 GoNexus 当前 AWS 部署方式：用了哪些 AWS 服务、它们之间怎么连接、每一部分在控制台怎么看、出问题时先查哪里。

当前部署目标是低成本演示环境，而不是完整生产环境。因此没有使用 ALB、NAT Gateway、ElastiCache、Amazon MQ 等更完整但更贵的托管组件。

## 当前整体架构

```text
用户浏览器
  |
  | 访问静态网页
  v
S3 Static Website
  |
  | 前端 JS 请求 VITE_API_BASE_URL
  v
ECS Fargate Public IP:9090
  |
  | backend 容器
  | redis 容器
  | rabbitmq 容器
  v
RDS MySQL

GitHub Actions
  |
  | OIDC 临时登录 AWS
  v
IAM Role
  |
  | 推镜像 / 更新 ECS / 同步 S3
  v
ECR + ECS + S3
```

## 使用的 AWS 服务

### S3

S3 用来托管前端静态页面。

当前前端构建产物来自：

```text
GoNexus/frontend/dist
```

同步到 S3 bucket：

```text
gonexus-frontend-669309613123
```

访问形式是 S3 website endpoint：

```text
http://gonexus-frontend-669309613123.s3-website-ap-northeast-1.amazonaws.com
```

前端是 Vite 项目，API 地址在构建时通过环境变量写入：

```text
VITE_API_BASE_URL
```

因此如果后端公网 IP 变化，需要重新构建前端并同步到 S3。

控制台查看路径：

```text
S3 -> Buckets -> gonexus-frontend-669309613123
```

重点看：

- Objects：是否有 `index.html` 和 `assets/`
- Properties：Static website hosting 是否开启
- Permissions：bucket policy 是否允许公开读取静态文件

常用命令：

```powershell
aws s3 ls s3://gonexus-frontend-669309613123 --region ap-northeast-1

aws s3 sync GoNexus/frontend/dist s3://gonexus-frontend-669309613123 `
  --delete `
  --region ap-northeast-1
```

### ECR

ECR 用来保存后端 Docker 镜像。

当前仓库：

```text
gonexus-backend
```

镜像地址格式：

```text
669309613123.dkr.ecr.ap-northeast-1.amazonaws.com/gonexus-backend:<tag>
```

CD workflow 会推两个 tag：

```text
<git commit sha>
latest
```

ECS Task Definition 实际部署时使用 commit sha 作为镜像 tag，这样可以知道当前线上版本来自哪个提交。

控制台查看路径：

```text
ECR -> Private repositories -> gonexus-backend
```

重点看：

- Images：是否有新镜像
- Image tag：是否有 commit sha 和 latest
- Pushed at：是否是最新部署时间

常用命令：

```powershell
aws ecr describe-images `
  --repository-name gonexus-backend `
  --region ap-northeast-1 `
  --query "imageDetails[].imageTags"
```

### ECS Fargate

ECS Fargate 用来运行后端服务。

当前配置：

```text
Cluster: gonexus-cluster
Service: gonexus-backend-service
Task family: gonexus-task
Launch type: FARGATE
Region: ap-northeast-1
```

一个 ECS Task 内运行三个容器：

```text
backend
redis
rabbitmq
```

原因是为了省钱：

- Redis 没有使用 ElastiCache
- RabbitMQ 没有使用 Amazon MQ
- 它们作为 sidecar 容器和 backend 跑在同一个 Fargate Task 内

backend 对 Redis 和 RabbitMQ 的访问地址是：

```text
127.0.0.1
```

这是因为同一个 ECS Task 的容器共享 awsvpc 网络命名空间，可以通过 localhost 互相访问。

控制台查看路径：

```text
ECS -> Clusters -> gonexus-cluster -> Services -> gonexus-backend-service
```

重点看：

- Desired tasks：期望任务数
- Running tasks：正在运行任务数
- Deployments：是否稳定
- Events：最近启动或失败原因
- Tasks：当前运行中的 task

常用命令：

```powershell
aws ecs describe-services `
  --cluster gonexus-cluster `
  --services gonexus-backend-service `
  --region ap-northeast-1 `
  --query "services[0].{status:status,desired:desiredCount,running:runningCount,pending:pendingCount,taskDefinition:taskDefinition,events:events[0:10].message}"
```

### ECS Task Definition

Task Definition 描述 ECS 应该如何启动容器。

当前由脚本生成并注册：

```text
GoNexus/scripts/register-ecs-task.ps1
```

它会生成：

```text
GoNexus/aws/task-definition.generated.json
```

这个 generated 文件不提交到 Git，因为里面包含具体账号、镜像、RDS endpoint 等环境信息。

Task Definition 里包含：

- backend 镜像地址
- backend 暴露端口 `9090`
- Redis 容器
- RabbitMQ 容器
- CloudWatch Logs 配置
- 普通环境变量
- SSM Parameter Store 参数引用

控制台查看路径：

```text
ECS -> Task definitions -> gonexus-task
```

重点看：

- Revision：当前使用第几个版本
- Container definitions：backend/redis/rabbitmq 是否都在
- Environment variables：非敏感配置
- Secrets：是否引用 `/gonexus/prod/...`
- Log configuration：是否写到 `/ecs/gonexus`

### RDS MySQL

RDS MySQL 用来保存业务数据。

当前实例：

```text
DB instance identifier: gonexus
Engine: MySQL Community
Class: db.t4g.micro
Region: ap-northeast-1
```

注意：

```text
RDS 实例标识符 gonexus 不等于 MySQL 数据库名。
```

实例标识符是 AWS 资源名，真正的数据库需要在 MySQL 内创建，比如：

```sql
CREATE DATABASE GoNexus;
```

本项目曾使用一次性 ECS Task 创建数据库：

```text
GoNexus/scripts/create-rds-database.ps1
```

控制台查看路径：

```text
RDS -> Databases -> gonexus
```

重点看：

- Status：是否 available
- Endpoint：后端连接用的 RDS endpoint
- Port：3306
- VPC security groups：是否允许 ECS 安全组访问 3306
- Public access：当前不依赖公网访问，主要让 ECS 访问

常用命令：

```powershell
aws rds describe-db-instances `
  --db-instance-identifier gonexus `
  --region ap-northeast-1 `
  --query "DBInstances[0].Endpoint.Address" `
  --output text
```

### SSM Parameter Store

SSM Parameter Store 用来保存配置和密钥。

参数路径前缀：

```text
/gonexus/prod
```

主要参数包括：

```text
/gonexus/prod/jwt-key
/gonexus/prod/mysql-password
/gonexus/prod/rabbitmq-password
/gonexus/prod/register-secret
/gonexus/prod/default-username
/gonexus/prod/default-password
/gonexus/prod/chat-api-key
/gonexus/prod/chat-base-url
/gonexus/prod/chat-model-id
/gonexus/prod/embedding-api-key
/gonexus/prod/embedding-base-url
/gonexus/prod/embedding-model-id
/gonexus/prod/embedding-dimension
/gonexus/prod/vision-api-key
/gonexus/prod/vision-base-url
/gonexus/prod/vision-model-id
```

本地 `config.toml` 不提交到 Git。通过脚本把配置推到 SSM：

```text
GoNexus/scripts/push-ssm-params.ps1
```

ECS Task 启动时，由 `gonexus-ecs-task-execution-role` 读取这些 SSM 参数，并注入容器环境变量。

控制台查看路径：

```text
Systems Manager -> Parameter Store -> My parameters -> /gonexus/prod
```

重点看：

- 参数名是否存在
- 类型是 String 还是 SecureString
- 值是否更新
- 区域是否是 ap-northeast-1

常用命令：

```powershell
aws ssm get-parameter `
  --name /gonexus/prod/register-secret `
  --with-decryption `
  --region ap-northeast-1
```

不要把命令输出里的密钥值贴到公开位置。

### CloudWatch Logs

CloudWatch Logs 用来查看 ECS 容器日志。

当前 log group：

```text
/ecs/gonexus
```

日志流前缀：

```text
backend
redis
rabbitmq
```

控制台查看路径：

```text
CloudWatch -> Logs -> Log groups -> /ecs/gonexus
```

常用命令：

```powershell
aws logs tail /ecs/gonexus `
  --region ap-northeast-1 `
  --since 30m `
  --log-stream-name-prefix backend
```

如果 Windows PowerShell 出现 GBK 编码错误，可以尝试：

```powershell
$env:PYTHONIOENCODING="utf-8"
```

然后重新执行日志命令。

### IAM Role

当前主要有两个项目相关 IAM Role。

#### gonexus-ecs-task-execution-role

这个 Role 给 ECS Task 使用。

作用：

- 从 ECR 拉取镜像
- 写 CloudWatch Logs
- 从 SSM Parameter Store 读取参数
- 解密 SecureString

Trust entity：

```text
ecs-tasks.amazonaws.com
```

相关文件：

```text
GoNexus/aws/ecs-task-execution-trust.json
GoNexus/aws/ecs-task-execution-ssm-policy.json
```

#### gonexus-github-actions-deploy-role

这个 Role 给 GitHub Actions CD 使用。

作用：

- GitHub Actions 通过 OIDC 临时登录 AWS
- 推送镜像到 ECR
- 注册 ECS Task Definition
- 更新 ECS Service
- 查询 ECS Task 的 Public IP
- 同步前端到 S3

GitHub 仓库 Secret：

```text
AWS_ROLE_TO_ASSUME
```

值是 Role ARN，例如：

```text
arn:aws:iam::669309613123:role/gonexus-github-actions-deploy-role
```

相关文件：

```text
GoNexus/aws/github-actions-deploy-policy.json
```

Trust policy 只允许 `master` 分支部署：

```text
repo:BK-1107/GoNexus:ref:refs/heads/master
```

这样 `improve/code-quality` 分支不能直接部署 AWS。

### GitHub Actions

当前有两个 workflow。

#### CI

文件：

```text
.github/workflows/ci.yml
```

作用：

- Go test
- Go build
- 前端 npm build
- master push 时构建 Docker 镜像

CI 不部署 AWS，只负责确认代码能构建。

#### Deploy

文件：

```text
.github/workflows/deploy.yml
```

触发方式：

```text
workflow_dispatch
```

也就是手动运行：

```text
GitHub -> Actions -> Deploy -> Run workflow
```

主要流程：

1. GitHub Actions 通过 OIDC 扮演 AWS IAM Role。
2. 构建后端 Docker 镜像。
3. 推送镜像到 ECR。
4. 注册新的 ECS Task Definition。
5. 更新 ECS Service。
6. 等待 ECS 稳定。
7. 查询新的 Fargate Public IP。
8. 使用新 IP 设置 `VITE_API_BASE_URL`。
9. 构建前端。
10. 同步前端到 S3。

这是为了适配当前不使用 ALB 的低成本架构。

## 网络和安全组关系

当前没有 ALB，后端直接通过 ECS Task Public IP 暴露：

```text
http://<ECS_PUBLIC_IP>:9090/api/v1
```

安全组关系大致是：

```text
浏览器本机 IP
  |
  | TCP 9090
  v
ECS Security Group
  |
  | TCP 3306
  v
RDS Security Group
```

ECS 安全组需要允许：

- 入站 TCP 9090，来源可以是你的本机公网 IP `/32`
- 出站访问 RDS 3306
- 出站访问外部 LLM API

RDS 安全组需要允许：

- 入站 TCP 3306，来源是 ECS 安全组

控制台查看路径：

```text
EC2 -> Security Groups
```

重点看：

- `gonexus-ecs-sg`：ECS Task 用
- RDS 绑定的 security group：MySQL 3306 是否允许 ECS SG

## 当前低成本架构的限制

### Fargate Public IP 会变化

因为没有 ALB 或固定域名，ECS Task 每次替换后 Public IP 可能变化。

这会影响前端：

```text
S3 前端 JS 中的 API 地址可能变成旧 IP。
```

解决方式：

- 手动重新构建前端并同步 S3
- 或使用 Deploy workflow 自动处理

相关故障文档：

```text
docs/zh/AWS部署故障排查-前端旧API地址.md
```

### Redis 和 RabbitMQ 数据不持久

当前 Redis 和 RabbitMQ 跑在同一个 Fargate Task 内，没有挂载 EFS，也没有使用托管服务。

任务重启后：

- Redis 数据可能丢失
- RabbitMQ 队列数据可能丢失

这是演示环境可接受的取舍。

如果要更接近生产：

- Redis 改用 ElastiCache
- RabbitMQ 改用 Amazon MQ
- 或为 Fargate 配 EFS

### 没有 HTTPS

当前 S3 website endpoint 和后端 Public IP 都是 HTTP。

如果要 HTTPS：

- 前端可以用 CloudFront + ACM
- 后端可以用 ALB + ACM
- API 可以绑定域名

当前为了成本暂时没有做。

## 常见排查入口

### 前端页面打不开

先查 S3：

```powershell
aws s3 ls s3://gonexus-frontend-669309613123 --region ap-northeast-1
```

再查 S3 website hosting 是否开启。

### 页面能打开，但 API 全部失败

先查当前 ECS Public IP：

```powershell
$TASK_ARN=(aws ecs list-tasks `
  --cluster gonexus-cluster `
  --service-name gonexus-backend-service `
  --desired-status RUNNING `
  --region ap-northeast-1 `
  --query "taskArns[0]" `
  --output text)

$ENI_ID=(aws ecs describe-tasks `
  --cluster gonexus-cluster `
  --tasks $TASK_ARN `
  --region ap-northeast-1 `
  --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" `
  --output text)

aws ec2 describe-network-interfaces `
  --network-interface-ids $ENI_ID `
  --region ap-northeast-1 `
  --query "NetworkInterfaces[0].Association.PublicIp" `
  --output text
```

再查 S3 前端 JS 中是否还是旧 IP。

### 后端服务没起来

查 ECS Service：

```powershell
aws ecs describe-services `
  --cluster gonexus-cluster `
  --services gonexus-backend-service `
  --region ap-northeast-1 `
  --query "services[0].events[0:10].message"
```

查容器日志：

```powershell
aws logs tail /ecs/gonexus `
  --region ap-northeast-1 `
  --since 30m `
  --log-stream-name-prefix backend
```

### 数据库连接失败

看日志是否有：

```text
Access denied
Unknown database
connection refused
```

分别对应：

- 密码不对或 SSM 参数不对
- MySQL 内没有创建数据库
- 安全组或 RDS 状态问题

### AI、Embedding、Vision 失败

先查 SSM 参数是否存在：

```powershell
aws ssm get-parameters-by-path `
  --path /gonexus/prod `
  --with-decryption `
  --region ap-northeast-1
```

重点确认：

- chat 参数
- embedding 参数
- vision 参数

不要把密钥值贴到公开位置。

## 成本相关说明

当前持续计费的主要资源：

- RDS MySQL
- ECS Fargate running task
- ECR 镜像存储
- S3 存储和请求
- CloudWatch Logs
- 公网 IPv4

当前没有使用：

- NAT Gateway
- ALB
- ElastiCache
- Amazon MQ
- CloudFront

因此成本较低，但也牺牲了固定入口、HTTPS、托管 Redis/RabbitMQ 和更完整的生产可用性。

如果只是面试展示，可以在展示前启动，展示后停止或删除不需要的资源。

## 总结说明

这个项目在 AWS 上采用低成本容器化部署方案：

- 后端使用 Docker 构建镜像并推送到 ECR。
- ECS Fargate 运行后端、Redis、RabbitMQ 三个容器。
- RDS MySQL 作为持久化数据库。
- SSM Parameter Store 管理密钥和环境配置。
- CloudWatch Logs 收集容器日志。
- S3 Static Website 托管前端。
- GitHub Actions 使用 OIDC 扮演 IAM Role，实现无长期 Access Key 的手动 CD。

为了控制成本，当前没有使用 ALB，所以 ECS Public IP 会变化。为了解决这个问题，CD 流程会在后端部署完成后读取新的 Fargate Public IP，并用这个 IP 重新构建前端再同步到 S3。

重点展示：

- Docker 化
- AWS 基础服务组合
- IAM 最小权限思路
- SSM 密钥管理
- ECS Fargate 部署
- GitHub Actions OIDC/CD
- CloudWatch 日志排查
- 成本和架构取舍意识
