# AWS 部署故障排查：前端仍请求旧 ECS 公网 IP

## 本次问题现象

AWS 部署后，前端页面可以打开，但出现：

- 登录一直失败
- API 调用失败
- 本地直接调用某些后端接口却可能是成功的

本次实际排查结果是：后端 ECS 服务正常运行，但 S3 上的前端静态文件仍然编译着旧的后端公网 IP。

旧 API 地址：

```text
http://3.112.93.109:9090/api/v1
```

当前 ECS 后端实际地址：

```text
http://13.230.64.240:9090/api/v1
```

因此浏览器访问 S3 前端时，请求仍然打到旧 IP，导致登录和 API 调用失败。

## 为什么会出现这个问题

当前省钱部署方案没有使用 ALB，而是让 ECS Fargate Task 直接分配公网 IP。

这种方式成本低，但有一个重要副作用：

```text
Fargate Task 每次重启、重新部署、替换任务后，公网 IP 可能变化。
```

前端是 Vite 静态站点，构建时会把 `VITE_API_BASE_URL` 编译进最终 JS 文件：

```text
GoNexus/frontend/src/api/base.ts
```

如果后端公网 IP 变了，但前端没有重新构建并上传到 S3，那么线上前端仍然会请求旧 IP。

这不是 SSM 参数读取失败，也不是后端登录逻辑一定有问题，而是前后端地址断开了。

## 本次排查步骤

### 1. 确认 ECS Service 是否正常

```powershell
aws ecs describe-services `
  --cluster gonexus-cluster `
  --services gonexus-backend-service `
  --region ap-northeast-1 `
  --query "services[0].{status:status,desired:desiredCount,running:runningCount,pending:pendingCount,taskDefinition:taskDefinition,events:events[0:10].message}"
```

本次结果显示：

```text
status = ACTIVE
desired = 1
running = 1
pending = 0
```

说明 ECS 后端服务本身是运行中的。

### 2. 获取当前 Fargate Task 公网 IP

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

$PUBLIC_IP=(aws ec2 describe-network-interfaces `
  --network-interface-ids $ENI_ID `
  --region ap-northeast-1 `
  --query "NetworkInterfaces[0].Association.PublicIp" `
  --output text)

echo $PUBLIC_IP
```

本次得到的新公网 IP：

```text
13.230.64.240
```

### 3. 检查后端日志

```powershell
aws logs tail /ecs/gonexus `
  --region ap-northeast-1 `
  --since 90m `
  --log-stream-name-prefix backend
```

本次后端日志显示：

```text
AIHelperManager init success
redis init success
rabbitmq init success
```

RabbitMQ 启动初期有连接重试是正常的，因为 backend 和 rabbitmq 在同一个 ECS Task 内，rabbitmq 容器可能比 backend 慢一点启动。

### 4. 直接验证当前后端 API

验证 CORS 预检：

```powershell
Invoke-WebRequest `
  -Method Options `
  -Uri "http://13.230.64.240:9090/api/v1/user/login" `
  -Headers @{
    Origin="http://gonexus-frontend-669309613123.s3-website-ap-northeast-1.amazonaws.com"
    "Access-Control-Request-Method"="POST"
    "Access-Control-Request-Headers"="content-type"
  }
```

本次返回：

```text
StatusCode = 204
```

验证邀请码接口：

```powershell
$INVITE=(aws ssm get-parameter `
  --name /gonexus/prod/register-secret `
  --with-decryption `
  --region ap-northeast-1 `
  --query Parameter.Value `
  --output text).Trim()

Invoke-RestMethod `
  -Method Post `
  -Uri "http://13.230.64.240:9090/api/v1/user/check-invite" `
  -ContentType "application/json" `
  -Body (@{ inviteCode = $INVITE } | ConvertTo-Json)
```

本次返回：

```text
status_code = 1000
status_msg = success
```

说明后端 API、CORS、SSM 参数都没有问题。

### 5. 检查 S3 前端 JS 里编译的 API 地址

先查看 S3 assets：

```powershell
aws s3 ls s3://gonexus-frontend-669309613123/assets/ `
  --region ap-northeast-1
```

再下载线上 JS 并搜索 API 地址：

```powershell
aws s3 cp s3://gonexus-frontend-669309613123/assets/index-CWTuCP-k.js - `
  --region ap-northeast-1 |
  Select-String -Pattern "http://[0-9.]+:9090/api/v1|/api/v1" -AllMatches |
  ForEach-Object { $_.Matches.Value } |
  Select-Object -Unique
```

本次发现线上前端仍然是：

```text
http://3.112.93.109:9090/api/v1
```

这就是根因。

## 本次修复方法

使用当前 ECS 后端公网 IP 重新构建前端：

```powershell
cd C:\Users\Administrator\Desktop\GoNexus-main\GoNexus\frontend

$env:VITE_API_BASE_URL="http://13.230.64.240:9090/api/v1"
npm.cmd run build
```

同步前端到 S3：

```powershell
aws s3 sync dist s3://gonexus-frontend-669309613123 `
  --delete `
  --region ap-northeast-1
```

确认线上 JS 已更新为新地址：

```powershell
aws s3 cp s3://gonexus-frontend-669309613123/assets/index-Dg5Gbzfk.js - `
  --region ap-northeast-1 |
  Select-String -Pattern "http://[0-9.]+:9090/api/v1|/api/v1" -AllMatches |
  ForEach-Object { $_.Matches.Value } |
  Select-Object -Unique
```

确认结果：

```text
http://13.230.64.240:9090/api/v1
```

最后浏览器需要强制刷新：

```text
Ctrl + F5
```

如果仍然使用旧 JS，可以使用无痕窗口访问，排除浏览器缓存。

## 以后遇到同类问题的判断顺序

1. 先确认 ECS service 是否 running。
2. 获取当前 ECS task public IP。
3. 直接用当前 public IP 调后端 API。
4. 如果后端 API 正常，再查 S3 前端 JS 中的 `VITE_API_BASE_URL`。
5. 如果前端 JS 是旧 IP，重新 build 前端并同步 S3。
6. 浏览器强刷或无痕窗口验证。

## 长期改进方案

### 方案 A：继续省钱，不使用 ALB

继续使用 Fargate Public IP，但必须保证每次后端重新部署后：

1. 查询新的 ECS Public IP。
2. 用新 IP 重新构建前端。
3. 同步前端到 S3。

项目里的 GitHub Actions CD 已经按这个思路设计：

```text
.github/workflows/deploy.yml
```

它会在部署后端后自动读取新的 Fargate Public IP，再用新 IP build 前端并上传 S3。

### 方案 B：使用 ALB 或固定域名

更正式的做法是：

```text
S3/CloudFront 前端 -> 固定 API 域名 -> ALB -> ECS Service
```

优点：

- 前端不用每次因 Fargate IP 变化而重新构建。
- 可以使用 HTTPS。
- 后端可以滚动部署。
- 面试表达更接近生产实践。

缺点：

- ALB 会额外收费。
- 对当前个人展示项目来说成本更高。

当前阶段为了控制成本，暂时采用方案 A。

## 面试时可以这样解释

当前项目为了降低演示成本，没有使用 ALB，而是让 ECS Fargate Task 暴露公网 IP。这个方案便宜，但公网 IP 会随任务替换变化，因此前端静态资源中编译的 API 地址需要在每次部署后更新。

我通过 CloudWatch Logs、ECS Describe Tasks、S3 静态资源检查定位到问题：后端运行正常，CORS 和 SSM 参数也正常，真正原因是 S3 前端仍然请求旧的 Fargate IP。

后续我把这个过程自动化进 GitHub Actions CD：部署后端、等待 ECS 稳定、读取新 Public IP、重新构建前端并同步到 S3。这样在不使用 ALB 的低成本架构下，也能保持前后端地址一致。
