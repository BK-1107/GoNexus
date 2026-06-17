param(
    [string]$ConfigPath = "config/config.toml",
    [string]$Stage = "prod",
    [string]$Region = "ap-northeast-1",
    [string]$Prefix = "/gonexus",
    [switch]$Overwrite,
    [switch]$IncludeEmpty,
    [switch]$DryRun
)

$ErrorActionPreference = "Stop"

function Read-SimpleToml {
    param([string]$Path)

    if (-not (Test-Path $Path)) {
        throw "Config file not found: $Path"
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

function Get-FirstTomlValue {
    param(
        [hashtable]$Config,
        [array]$Sources
    )

    foreach ($source in $Sources) {
        $value = Get-TomlValue -Config $Config -Section $source.Section -Key $source.Key
        if (-not [string]::IsNullOrWhiteSpace($value)) {
            return $value
        }
    }
    return $null
}

function Put-Parameter {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Type = "SecureString"
    )

    if ([string]::IsNullOrWhiteSpace($Value) -and -not $IncludeEmpty) {
        Write-Host "SKIP $Name (empty)"
        return
    }

    if ($DryRun) {
        Write-Host "DRYRUN put $Name ($Type)"
        return
    }

    $args = @(
        "ssm", "put-parameter",
        "--name", $Name,
        "--type", $Type,
        "--value", $Value,
        "--region", $Region
    )

    if ($Overwrite) {
        $args += "--overwrite"
    }

    & aws @args | Out-Null
    Write-Host "OK $Name ($Type)"
}

$config = Read-SimpleToml -Path $ConfigPath
$base = "$Prefix/$Stage"

$mappings = @(
    @{ Name = "$base/jwt-key"; Section = "jwtConfig"; Key = "key"; Type = "SecureString" },
    @{ Name = "$base/mysql-password"; Section = "mysqlConfig"; Key = "password"; Type = "SecureString" },
    @{ Name = "$base/rabbitmq-password"; Section = "rabbitmqConfig"; Key = "password"; Type = "SecureString" },
    @{ Name = "$base/chat-api-key"; Type = "SecureString"; Sources = @(@{ Section = "chatModelConfig"; Key = "apiKey" }, @{ Section = "ragModelConfig"; Key = "apiKey" }) },
    @{ Name = "$base/chat-base-url"; Type = "String"; Sources = @(@{ Section = "chatModelConfig"; Key = "baseUrl" }, @{ Section = "ragModelConfig"; Key = "baseUrl" }) },
    @{ Name = "$base/chat-model-id"; Type = "String"; Sources = @(@{ Section = "chatModelConfig"; Key = "modelName" }, @{ Section = "ragModelConfig"; Key = "chatModelName" }) },
    @{ Name = "$base/embedding-api-key"; Type = "SecureString"; Sources = @(@{ Section = "embeddingModelConfig"; Key = "apiKey" }, @{ Section = "ragModelConfig"; Key = "apiKey" }) },
    @{ Name = "$base/embedding-base-url"; Type = "String"; Sources = @(@{ Section = "embeddingModelConfig"; Key = "baseUrl" }, @{ Section = "ragModelConfig"; Key = "baseUrl" }) },
    @{ Name = "$base/embedding-model-id"; Type = "String"; Sources = @(@{ Section = "embeddingModelConfig"; Key = "modelName" }, @{ Section = "ragModelConfig"; Key = "embeddingModel" }) },
    @{ Name = "$base/embedding-dimension"; Type = "String"; Sources = @(@{ Section = "embeddingModelConfig"; Key = "dimension" }, @{ Section = "ragModelConfig"; Key = "dimension" }) },
    @{ Name = "$base/vision-api-key"; Type = "SecureString"; Sources = @(@{ Section = "visionModelConfig"; Key = "apiKey" }, @{ Section = "embeddingModelConfig"; Key = "apiKey" }, @{ Section = "ragModelConfig"; Key = "apiKey" }) },
    @{ Name = "$base/vision-base-url"; Type = "String"; Sources = @(@{ Section = "visionModelConfig"; Key = "baseUrl" }, @{ Section = "embeddingModelConfig"; Key = "baseUrl" }, @{ Section = "ragModelConfig"; Key = "baseUrl" }) },
    @{ Name = "$base/vision-model-id"; Type = "String"; Sources = @(@{ Section = "visionModelConfig"; Key = "modelName" }, @{ Section = "ragModelConfig"; Key = "chatModelName" }) },
    @{ Name = "$base/register-secret"; Section = "registerConfig"; Key = "secret"; Type = "SecureString" },
    @{ Name = "$base/default-username"; Section = "defaultUserConfig"; Key = "username"; Type = "String" },
    @{ Name = "$base/default-password"; Section = "defaultUserConfig"; Key = "password"; Type = "SecureString" },
    @{ Name = "$base/email"; Section = "emailConfig"; Key = "email"; Type = "String" },
    @{ Name = "$base/email-authcode"; Section = "emailConfig"; Key = "authcode"; Type = "SecureString" },
    @{ Name = "$base/voice-api-key"; Section = "voiceServiceConfig"; Key = "voiceServiceApiKey"; Type = "SecureString" },
    @{ Name = "$base/voice-secret-key"; Section = "voiceServiceConfig"; Key = "voiceServiceSecretKey"; Type = "SecureString" }
)

foreach ($mapping in $mappings) {
    if ($mapping.ContainsKey("Sources")) {
        $value = Get-FirstTomlValue -Config $config -Sources $mapping.Sources
    } else {
        $value = Get-TomlValue -Config $config -Section $mapping.Section -Key $mapping.Key
    }
    Put-Parameter -Name $mapping.Name -Value $value -Type $mapping.Type
}

Write-Host "Done. Parameters are under $base in $Region."
