param(
    [string]$Region = "ap-northeast-1",
    [string]$Cluster = "gonexus-cluster",
    [string]$DbInstanceIdentifier = "gonexus",
    [string]$DbName = "GoNexus",
    [string]$DbUser = "admin",
    [string]$ExecutionRoleName = "gonexus-ecs-task-execution-role",
    [string]$MysqlPasswordParameter = "/gonexus/prod/mysql-password",
    [string[]]$Subnets = @("subnet-0feb0363f740ddc11", "subnet-0560e65c6b4ee2523", "subnet-099ef2ee47aa896be"),
    [string]$SecurityGroup = "sg-0d097e00997461e80",
    [string]$Family = "gonexus-db-init",
    [string]$LogGroup = "/ecs/gonexus",
    [string]$OutFile = "aws/db-init-task.generated.json"
)

$ErrorActionPreference = "Stop"

$accountId = (& aws sts get-caller-identity --query Account --output text).Trim()
$rdsEndpoint = (& aws rds describe-db-instances `
    --db-instance-identifier $DbInstanceIdentifier `
    --region $Region `
    --query "DBInstances[0].Endpoint.Address" `
    --output text).Trim()

$executionRoleArn = "arn:aws:iam::${accountId}:role/${ExecutionRoleName}"
$mysqlPasswordArn = "arn:aws:ssm:${Region}:${accountId}:parameter/$($MysqlPasswordParameter.TrimStart('/'))"

if ($DbName -notmatch '^[A-Za-z0-9_]+$') {
    throw "DbName may only contain letters, numbers, and underscores: $DbName"
}

$sql = "CREATE DATABASE IF NOT EXISTS $DbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci; SHOW DATABASES LIKE '$DbName';"
$command = "mysql -h `"$rdsEndpoint`" -P 3306 -u `"$DbUser`" -e `"$sql`""

$taskDefinition = [ordered]@{
    family                  = $Family
    networkMode             = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu                     = "256"
    memory                  = "512"
    executionRoleArn        = $executionRoleArn
    runtimePlatform         = @{
        operatingSystemFamily = "LINUX"
        cpuArchitecture       = "X86_64"
    }
    containerDefinitions    = @(
        [ordered]@{
            name      = "mysql-client"
            image     = "mysql:8.0"
            essential = $true
            command   = @("sh", "-c", $command)
            secrets = @(
                @{ name = "MYSQL_PWD"; valueFrom = $mysqlPasswordArn }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options   = @{
                    "awslogs-group"         = $LogGroup
                    "awslogs-region"        = $Region
                    "awslogs-stream-prefix" = "db-init"
                }
            }
        }
    )
}

$json = $taskDefinition | ConvertTo-Json -Depth 20
$outDir = Split-Path -Parent $OutFile
if ($outDir -and -not (Test-Path $outDir)) {
    New-Item -ItemType Directory -Force -Path $outDir | Out-Null
}
[System.IO.File]::WriteAllText((Resolve-Path -LiteralPath $outDir).Path + [System.IO.Path]::DirectorySeparatorChar + (Split-Path -Leaf $OutFile), $json, [System.Text.UTF8Encoding]::new($false))

$existingLogGroup = (& aws logs describe-log-groups `
    --log-group-name-prefix $LogGroup `
    --region $Region `
    --query "logGroups[?logGroupName=='$LogGroup'].logGroupName | [0]" `
    --output text).Trim()

if ($existingLogGroup -ne $LogGroup) {
    aws logs create-log-group --log-group-name $LogGroup --region $Region | Out-Null
}

Write-Host "Registering one-off DB init task definition..."
aws ecs register-task-definition --cli-input-json "file://$OutFile" --region $Region | Out-Null

$subnetList = $Subnets -join ","
$networkConfiguration = "awsvpcConfiguration={subnets=[$subnetList],securityGroups=[$SecurityGroup],assignPublicIp=ENABLED}"

Write-Host "Running one-off DB init task against $rdsEndpoint..."
$taskArn = (& aws ecs run-task `
    --cluster $Cluster `
    --task-definition $Family `
    --launch-type FARGATE `
    --network-configuration $networkConfiguration `
    --region $Region `
    --query "tasks[0].taskArn" `
    --output text).Trim()

Write-Host "Task: $taskArn"
aws ecs wait tasks-stopped --cluster $Cluster --tasks $taskArn --region $Region

Write-Host "Task stopped. Container result:"
aws ecs describe-tasks `
    --cluster $Cluster `
    --tasks $taskArn `
    --region $Region `
    --query "tasks[0].containers[*].{name:name,lastStatus:lastStatus,exitCode:exitCode,reason:reason}"

Write-Host "Recent db-init logs:"
aws logs tail $LogGroup --region $Region --since 10m --log-stream-name-prefix db-init
