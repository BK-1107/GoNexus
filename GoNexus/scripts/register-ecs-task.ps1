param(
    [string]$AccountId,

    [string]$RdsEndpoint,

    [string]$DbInstanceIdentifier = "gonexus",
    [string]$ConfigPath = "config/config.toml",
    [string]$DbName,
    [string]$DbUser = "admin",
    [string]$Region = "ap-northeast-1",
    [string]$Family = "gonexus-task",
    [string]$ExecutionRoleName = "gonexus-ecs-task-execution-role",
    [string]$EcrRepository = "gonexus-backend",
    [string]$ImageTag = "latest",
    [string]$SsmPrefix = "/gonexus/prod",
    [string]$LogGroup = "/ecs/gonexus",
    [string]$OutFile = "aws/task-definition.generated.json",
    [switch]$Register
)

$ErrorActionPreference = "Stop"

function Read-SimpleToml {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        return @{}
    }

    $result = @{}
    $section = ""

    foreach ($rawLine in Get-Content -Path $Path) {
        $line = $rawLine.Trim()
        if ($line -eq "" -or $line.StartsWith("#")) {
            continue
        }

        if ($line -match '^\[(.+)\]$') {
            $section = $Matches[1].Trim()
            if (-not $result.ContainsKey($section)) {
                $result[$section] = @{}
            }
            continue
        }

        if ($line -match '^([^=]+?)\s*=\s*(.*)$') {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()

            $commentIndex = $value.IndexOf(" #")
            if ($commentIndex -ge 0) {
                $value = $value.Substring(0, $commentIndex).Trim()
            }

            if (($value.StartsWith('"') -and $value.EndsWith('"')) -or
                ($value.StartsWith("'") -and $value.EndsWith("'"))) {
                $value = $value.Substring(1, $value.Length - 2)
            }

            if ($section -eq "") {
                $section = "_root"
                if (-not $result.ContainsKey($section)) {
                    $result[$section] = @{}
                }
            }

            $result[$section][$key] = $value
        }
    }

    return $result
}

function Get-TomlValue {
    param(
        [hashtable]$Config,
        [string]$Section,
        [string]$Key
    )

    if (-not $Config.ContainsKey($Section)) {
        return $null
    }
    if (-not $Config[$Section].ContainsKey($Key)) {
        return $null
    }
    return $Config[$Section][$Key]
}

function SsmArn {
    param([string]$Name)
    $paramPath = "$SsmPrefix/$Name".TrimStart("/")
    return "arn:aws:ssm:${Region}:${AccountId}:parameter/${paramPath}"
}

if ([string]::IsNullOrWhiteSpace($AccountId)) {
    $AccountId = (& aws sts get-caller-identity --query Account --output text).Trim()
}

if ([string]::IsNullOrWhiteSpace($RdsEndpoint)) {
    $RdsEndpoint = (& aws rds describe-db-instances `
        --db-instance-identifier $DbInstanceIdentifier `
        --region $Region `
        --query "DBInstances[0].Endpoint.Address" `
        --output text).Trim()
}

if ([string]::IsNullOrWhiteSpace($DbName)) {
    $localConfig = Read-SimpleToml -Path $ConfigPath
    $DbName = Get-TomlValue -Config $localConfig -Section "mysqlConfig" -Key "databaseName"
}

if ([string]::IsNullOrWhiteSpace($DbName)) {
    $DbName = "GoNexus"
}

$imageUri = "${AccountId}.dkr.ecr.${Region}.amazonaws.com/${EcrRepository}:${ImageTag}"
$executionRoleArn = "arn:aws:iam::${AccountId}:role/${ExecutionRoleName}"

Write-Host "Using AWS account: $AccountId"
Write-Host "Using RDS endpoint: $RdsEndpoint"
Write-Host "Using DB name: $DbName"
Write-Host "Using image: $imageUri"

$taskDefinition = [ordered]@{
    family                  = $Family
    networkMode             = "awsvpc"
    requiresCompatibilities = @("FARGATE")
    cpu                     = "512"
    memory                  = "1024"
    executionRoleArn        = $executionRoleArn
    runtimePlatform         = @{
        operatingSystemFamily = "LINUX"
        cpuArchitecture       = "X86_64"
    }
    containerDefinitions    = @(
        [ordered]@{
            name         = "backend"
            image        = $imageUri
            essential    = $true
            portMappings = @(
                @{
                    containerPort = 9090
                    protocol      = "tcp"
                }
            )
            environment  = @(
                @{ name = "GIN_MODE"; value = "release" },
                @{ name = "GONEXUS_HOST"; value = "0.0.0.0" },
                @{ name = "GONEXUS_PORT"; value = "9090" },
                @{ name = "GONEXUS_LOG_DIR"; value = "logs" },
                @{ name = "GONEXUS_MYSQL_HOST"; value = $RdsEndpoint },
                @{ name = "GONEXUS_MYSQL_PORT"; value = "3306" },
                @{ name = "GONEXUS_MYSQL_USER"; value = $DbUser },
                @{ name = "GONEXUS_MYSQL_DATABASE"; value = $DbName },
                @{ name = "GONEXUS_MYSQL_CHARSET"; value = "utf8mb4" },
                @{ name = "GONEXUS_REDIS_HOST"; value = "127.0.0.1" },
                @{ name = "GONEXUS_REDIS_PORT"; value = "6379" },
                @{ name = "GONEXUS_REDIS_DB"; value = "0" },
                @{ name = "GONEXUS_RABBITMQ_HOST"; value = "127.0.0.1" },
                @{ name = "GONEXUS_RABBITMQ_PORT"; value = "5672" },
                @{ name = "GONEXUS_RABBITMQ_USERNAME"; value = "root" },
                @{ name = "GONEXUS_RABBITMQ_VHOST"; value = "/" },
                @{ name = "GONEXUS_JWT_EXPIRE_HOURS"; value = "168" },
                @{ name = "GONEXUS_JWT_ISSUER"; value = "GoNexus" },
                @{ name = "GONEXUS_JWT_SUBJECT"; value = "user" },
                @{ name = "GONEXUS_RAG_DOC_DIR"; value = "uploads" }
            )
            secrets      = @(
                @{ name = "GONEXUS_JWT_KEY"; valueFrom = SsmArn "jwt-key" },
                @{ name = "GONEXUS_MYSQL_PASSWORD"; valueFrom = SsmArn "mysql-password" },
                @{ name = "GONEXUS_RABBITMQ_PASSWORD"; valueFrom = SsmArn "rabbitmq-password" },
                @{ name = "GONEXUS_REGISTER_SECRET"; valueFrom = SsmArn "register-secret" },
                @{ name = "GONEXUS_DEFAULT_USERNAME"; valueFrom = SsmArn "default-username" },
                @{ name = "GONEXUS_DEFAULT_PASSWORD"; valueFrom = SsmArn "default-password" },
                @{ name = "GONEXUS_EMAIL"; valueFrom = SsmArn "email" },
                @{ name = "GONEXUS_EMAIL_AUTHCODE"; valueFrom = SsmArn "email-authcode" },
                @{ name = "CHAT_API_KEY"; valueFrom = SsmArn "chat-api-key" },
                @{ name = "CHAT_BASE_URL"; valueFrom = SsmArn "chat-base-url" },
                @{ name = "CHAT_MODEL_ID"; valueFrom = SsmArn "chat-model-id" },
                @{ name = "EMBEDDING_API_KEY"; valueFrom = SsmArn "embedding-api-key" },
                @{ name = "EMBEDDING_BASE_URL"; valueFrom = SsmArn "embedding-base-url" },
                @{ name = "EMBEDDING_MODEL_ID"; valueFrom = SsmArn "embedding-model-id" },
                @{ name = "EMBEDDING_DIMENSION"; valueFrom = SsmArn "embedding-dimension" },
                @{ name = "VISION_API_KEY"; valueFrom = SsmArn "vision-api-key" },
                @{ name = "VISION_BASE_URL"; valueFrom = SsmArn "vision-base-url" },
                @{ name = "VISION_MODEL_ID"; valueFrom = SsmArn "vision-model-id" }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options   = @{
                    "awslogs-group"         = $LogGroup
                    "awslogs-region"        = $Region
                    "awslogs-stream-prefix" = "backend"
                }
            }
        },
        [ordered]@{
            name         = "redis"
            image        = "redis/redis-stack-server:latest"
            essential    = $true
            portMappings = @(
                @{
                    containerPort = 6379
                    protocol      = "tcp"
                }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options   = @{
                    "awslogs-group"         = $LogGroup
                    "awslogs-region"        = $Region
                    "awslogs-stream-prefix" = "redis"
                }
            }
        },
        [ordered]@{
            name         = "rabbitmq"
            image        = "rabbitmq:3-management"
            essential    = $true
            portMappings = @(
                @{
                    containerPort = 5672
                    protocol      = "tcp"
                }
            )
            environment  = @(
                @{ name = "RABBITMQ_DEFAULT_USER"; value = "root" }
            )
            secrets      = @(
                @{ name = "RABBITMQ_DEFAULT_PASS"; valueFrom = SsmArn "rabbitmq-password" }
            )
            logConfiguration = @{
                logDriver = "awslogs"
                options   = @{
                    "awslogs-group"         = $LogGroup
                    "awslogs-region"        = $Region
                    "awslogs-stream-prefix" = "rabbitmq"
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
Write-Host "Wrote $OutFile"

if ($Register) {
    $existingLogGroup = (& aws logs describe-log-groups `
        --log-group-name-prefix $LogGroup `
        --region $Region `
        --query "logGroups[?logGroupName=='$LogGroup'].logGroupName | [0]" `
        --output text).Trim()

    if ($existingLogGroup -eq $LogGroup) {
        Write-Host "Log group already exists: $LogGroup"
    } else {
        aws logs create-log-group --log-group-name $LogGroup --region $Region
        Write-Host "Created log group: $LogGroup"
    }

    aws ecs register-task-definition --cli-input-json "file://$OutFile" --region $Region
}
