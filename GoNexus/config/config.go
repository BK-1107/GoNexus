package config

import (
	"log"
	"os"
	"strconv"

	"github.com/BurntSushi/toml"
)

type MainConfig struct {
	Port    int    `toml:"port"`
	AppName string `toml:"appName"`
	Host    string `toml:"host"`
}

type EmailConfig struct {
	Authcode string `toml:"authcode"`
	Email    string `toml:"email"`
}

type RedisConfig struct {
	RedisPort     int    `toml:"port"`
	RedisDb       int    `toml:"db"`
	RedisHost     string `toml:"host"`
	RedisPassword string `toml:"password"`
}

type MysqlConfig struct {
	MysqlPort         int    `toml:"port"`
	MysqlHost         string `toml:"host"`
	MysqlUser         string `toml:"user"`
	MysqlPassword     string `toml:"password"`
	MysqlDatabaseName string `toml:"databaseName"`
	MysqlCharset      string `toml:"charset"`
}

type JwtConfig struct {
	ExpireDuration int    `toml:"expire_duration"`
	Issuer         string `toml:"issuer"`
	Subject        string `toml:"subject"`
	Key            string `toml:"key"`
}

type Rabbitmq struct {
	RabbitmqPort     int    `toml:"port"`
	RabbitmqHost     string `toml:"host"`
	RabbitmqUsername string `toml:"username"`
	RabbitmqPassword string `toml:"password"`
	RabbitmqVhost    string `toml:"vhost"`
}

type RagModelConfig struct {
	RagEmbeddingModel string `toml:"embeddingModel"`
	RagChatModelName  string `toml:"chatModelName"`
	RagDocDir         string `toml:"docDir"`
	RagBaseUrl        string `toml:"baseUrl"`
	RagDimension      int    `toml:"dimension"`
	RagApiKey         string `toml:"apiKey"`
}

type ChatModelConfig struct {
	ModelName string `toml:"modelName"`
	BaseUrl   string `toml:"baseUrl"`
	ApiKey    string `toml:"apiKey"`
}

type EmbeddingModelConfig struct {
	ModelName string `toml:"modelName"`
	BaseUrl   string `toml:"baseUrl"`
	Dimension int    `toml:"dimension"`
	ApiKey    string `toml:"apiKey"`
}

type VisionModelConfig struct {
	ModelName string `toml:"modelName"`
	BaseUrl   string `toml:"baseUrl"`
	ApiKey    string `toml:"apiKey"`
}

type VoiceServiceConfig struct {
	VoiceServiceApiKey    string `toml:"voiceServiceApiKey"`
	VoiceServiceSecretKey string `toml:"voiceServiceSecretKey"`
}

type RegisterConfig struct {
	Secret string `toml:"secret"`
}

type DefaultUserConfig struct {
	Username string `toml:"username"`
	Password string `toml:"password"`
}

type Config struct {
	EmailConfig          `toml:"emailConfig"`
	RedisConfig          `toml:"redisConfig"`
	MysqlConfig          `toml:"mysqlConfig"`
	JwtConfig            `toml:"jwtConfig"`
	MainConfig           `toml:"mainConfig"`
	Rabbitmq             `toml:"rabbitmqConfig"`
	RagModelConfig       `toml:"ragModelConfig"`
	ChatModelConfig      `toml:"chatModelConfig"`
	EmbeddingModelConfig `toml:"embeddingModelConfig"`
	VisionModelConfig    `toml:"visionModelConfig"`
	VoiceServiceConfig   `toml:"voiceServiceConfig"`
	RegisterConfig       `toml:"registerConfig"`
	DefaultUserConfig    `toml:"defaultUserConfig"`
}

// RedisKeyConfig 定义验证码和 RAG 索引用到的 Redis key 命名规则。
type RedisKeyConfig struct {
	CaptchaPrefix   string
	IndexName       string
	IndexNamePrefix string
}

var DefaultRedisKeyConfig = RedisKeyConfig{
	CaptchaPrefix:   "captcha:%s",
	IndexName:       "rag_docs:%s:idx",
	IndexNamePrefix: "rag_docs:%s:",
}

var config *Config

// setStringFromEnv 在环境变量存在时覆盖字符串配置。
// 空值会被忽略，这样本地开发时仍然可以使用 config.toml 中的默认值。
func setStringFromEnv(target *string, key string) {
	if value := os.Getenv(key); value != "" {
		*target = value
	}
}

// setIntFromEnv 在环境变量存在时覆盖整数配置；解析失败时保留原值。
func setIntFromEnv(target *int, key string) {
	value := os.Getenv(key)
	if value == "" {
		return
	}
	parsed, err := strconv.Atoi(value)
	if err != nil {
		log.Printf("invalid integer for %s: %v", key, err)
		return
	}
	*target = parsed
}

// applyEnvOverrides 用于生产部署时从环境变量覆盖配置。
// 在 AWS ECS 中，这些值可以来自 task environment、SSM Parameter Store 或 Secrets Manager。
// 本地开发仍然保留 config.toml 作为默认配置来源。
func applyEnvOverrides(c *Config) {
	// HTTP 服务配置。
	setStringFromEnv(&c.MainConfig.Host, "GONEXUS_HOST")
	setIntFromEnv(&c.MainConfig.Port, "GONEXUS_PORT")
	setStringFromEnv(&c.MainConfig.AppName, "GONEXUS_APP_NAME")

	// 邮箱验证码使用的 SMTP 配置。
	setStringFromEnv(&c.EmailConfig.Email, "GONEXUS_EMAIL")
	setStringFromEnv(&c.EmailConfig.Authcode, "GONEXUS_EMAIL_AUTHCODE")

	// Redis / Redis Stack 配置。
	setStringFromEnv(&c.RedisConfig.RedisHost, "GONEXUS_REDIS_HOST")
	setIntFromEnv(&c.RedisConfig.RedisPort, "GONEXUS_REDIS_PORT")
	setIntFromEnv(&c.RedisConfig.RedisDb, "GONEXUS_REDIS_DB")
	setStringFromEnv(&c.RedisConfig.RedisPassword, "GONEXUS_REDIS_PASSWORD")

	// MySQL 配置。在 AWS 中通常指向 RDS endpoint。
	setStringFromEnv(&c.MysqlConfig.MysqlHost, "GONEXUS_MYSQL_HOST")
	setIntFromEnv(&c.MysqlConfig.MysqlPort, "GONEXUS_MYSQL_PORT")
	setStringFromEnv(&c.MysqlConfig.MysqlUser, "GONEXUS_MYSQL_USER")
	setStringFromEnv(&c.MysqlConfig.MysqlPassword, "GONEXUS_MYSQL_PASSWORD")
	setStringFromEnv(&c.MysqlConfig.MysqlDatabaseName, "GONEXUS_MYSQL_DATABASE")
	setStringFromEnv(&c.MysqlConfig.MysqlCharset, "GONEXUS_MYSQL_CHARSET")

	// JWT 签名密钥和 token 元数据配置。
	setIntFromEnv(&c.JwtConfig.ExpireDuration, "GONEXUS_JWT_EXPIRE_HOURS")
	setStringFromEnv(&c.JwtConfig.Issuer, "GONEXUS_JWT_ISSUER")
	setStringFromEnv(&c.JwtConfig.Subject, "GONEXUS_JWT_SUBJECT")
	setStringFromEnv(&c.JwtConfig.Key, "GONEXUS_JWT_KEY")

	// RabbitMQ 配置。生产环境中的密码应来自密钥管理服务。
	setStringFromEnv(&c.Rabbitmq.RabbitmqHost, "GONEXUS_RABBITMQ_HOST")
	setIntFromEnv(&c.Rabbitmq.RabbitmqPort, "GONEXUS_RABBITMQ_PORT")
	setStringFromEnv(&c.Rabbitmq.RabbitmqUsername, "GONEXUS_RABBITMQ_USERNAME")
	setStringFromEnv(&c.Rabbitmq.RabbitmqPassword, "GONEXUS_RABBITMQ_PASSWORD")
	setStringFromEnv(&c.Rabbitmq.RabbitmqVhost, "GONEXUS_RABBITMQ_VHOST")

	// LLM 和 RAG 配置。保留 OPENAI_* 别名以兼容 OpenAI 协议供应商。
	setStringFromEnv(&c.RagModelConfig.RagEmbeddingModel, "LLM_EMBEDDING_MODEL")
	setStringFromEnv(&c.RagModelConfig.RagChatModelName, "LLM_MODEL_ID")
	setStringFromEnv(&c.RagModelConfig.RagChatModelName, "OPENAI_MODEL_NAME")
	setStringFromEnv(&c.RagModelConfig.RagDocDir, "GONEXUS_RAG_DOC_DIR")
	setStringFromEnv(&c.RagModelConfig.RagBaseUrl, "LLM_BASE_URL")
	setStringFromEnv(&c.RagModelConfig.RagBaseUrl, "OPENAI_BASE_URL")
	setIntFromEnv(&c.RagModelConfig.RagDimension, "GONEXUS_RAG_DIMENSION")
	setStringFromEnv(&c.RagModelConfig.RagApiKey, "LLM_API_KEY")
	setStringFromEnv(&c.RagModelConfig.RagApiKey, "OPENAI_API_KEY")

	// Chat, embedding, and vision can use different providers in production.
	setStringFromEnv(&c.ChatModelConfig.ModelName, "CHAT_MODEL_ID")
	setStringFromEnv(&c.ChatModelConfig.ModelName, "DEEPSEEK_MODEL_ID")
	setStringFromEnv(&c.ChatModelConfig.BaseUrl, "CHAT_BASE_URL")
	setStringFromEnv(&c.ChatModelConfig.BaseUrl, "DEEPSEEK_BASE_URL")
	setStringFromEnv(&c.ChatModelConfig.ApiKey, "CHAT_API_KEY")
	setStringFromEnv(&c.ChatModelConfig.ApiKey, "DEEPSEEK_API_KEY")

	setStringFromEnv(&c.EmbeddingModelConfig.ModelName, "EMBEDDING_MODEL_ID")
	setStringFromEnv(&c.EmbeddingModelConfig.BaseUrl, "EMBEDDING_BASE_URL")
	setIntFromEnv(&c.EmbeddingModelConfig.Dimension, "EMBEDDING_DIMENSION")
	setStringFromEnv(&c.EmbeddingModelConfig.ApiKey, "EMBEDDING_API_KEY")
	setStringFromEnv(&c.EmbeddingModelConfig.ApiKey, "GOOGLE_API_KEY")
	setStringFromEnv(&c.EmbeddingModelConfig.ApiKey, "GEMINI_API_KEY")

	setStringFromEnv(&c.VisionModelConfig.ModelName, "VISION_MODEL_ID")
	setStringFromEnv(&c.VisionModelConfig.BaseUrl, "VISION_BASE_URL")
	setStringFromEnv(&c.VisionModelConfig.ApiKey, "VISION_API_KEY")
	setStringFromEnv(&c.VisionModelConfig.ApiKey, "GOOGLE_VISION_API_KEY")

	// 可选的语音服务凭证。
	setStringFromEnv(&c.VoiceServiceConfig.VoiceServiceApiKey, "GONEXUS_VOICE_API_KEY")
	setStringFromEnv(&c.VoiceServiceConfig.VoiceServiceSecretKey, "GONEXUS_VOICE_SECRET_KEY")

	// 注册控制和默认用户初始化配置。
	setStringFromEnv(&c.RegisterConfig.Secret, "GONEXUS_REGISTER_SECRET")
	setStringFromEnv(&c.DefaultUserConfig.Username, "GONEXUS_DEFAULT_USERNAME")
	setStringFromEnv(&c.DefaultUserConfig.Password, "GONEXUS_DEFAULT_PASSWORD")
}

// InitConfig 先加载本地 config.toml，再应用环境变量覆盖。
// 这样同一套代码可以同时支持本地开发和 AWS 容器化部署。
func InitConfig() error {
	// 容器中如果把 config.toml 挂载到其他路径，可以用 GONEXUS_CONFIG_PATH 指定。
	configPath := os.Getenv("GONEXUS_CONFIG_PATH")
	if configPath == "" {
		configPath = "config/config.toml"
	}

	// 生产环境允许没有 config.toml，因为 ECS 可以通过环境变量或注入的 secret 提供配置。
	if _, err := os.Stat(configPath); err == nil {
		if _, err := toml.DecodeFile(configPath, config); err != nil {
			return err
		}
	} else if !os.IsNotExist(err) {
		return err
	} else {
		log.Printf("config file %s not found; using environment variables and zero-value defaults", configPath)
	}

	applyEnvOverrides(config)
	return nil
}

// GetConfig 返回全局单例配置。
func GetConfig() *Config {
	if config == nil {
		config = new(Config)
		_ = InitConfig()
	}
	return config
}

// GetRegisterSecret 保持旧调用方式，同时允许 ECS task secret 覆盖本地 TOML 值。
func (c *Config) GetRegisterSecret() string {
	if secret := os.Getenv("GONEXUS_REGISTER_SECRET"); secret != "" {
		return secret
	}
	return c.RegisterConfig.Secret
}

// GetDefaultUsername 返回可选的初始化默认用户名。
func (c *Config) GetDefaultUsername() string {
	if username := os.Getenv("GONEXUS_DEFAULT_USERNAME"); username != "" {
		return username
	}
	return c.DefaultUserConfig.Username
}

// GetDefaultPassword 返回可选的初始化默认密码。
func (c *Config) GetDefaultPassword() string {
	if password := os.Getenv("GONEXUS_DEFAULT_PASSWORD"); password != "" {
		return password
	}
	return c.DefaultUserConfig.Password
}

// GetLLMAPIKey 同时支持通用 LLM_API_KEY 和 OpenAI 兼容的 OPENAI_API_KEY。
func (c *Config) GetLLMAPIKey() string {
	if key := os.Getenv("LLM_API_KEY"); key != "" {
		return key
	}
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		return key
	}
	return c.RagModelConfig.RagApiKey
}

// GetLLMModelID 同时支持通用和 OpenAI 兼容的模型环境变量名。
func (c *Config) GetLLMModelID() string {
	if modelID := os.Getenv("LLM_MODEL_ID"); modelID != "" {
		return modelID
	}
	if modelID := os.Getenv("OPENAI_MODEL_NAME"); modelID != "" {
		return modelID
	}
	return c.RagModelConfig.RagChatModelName
}

// GetLLMBaseURL 支持 Gemini、DashScope 等 OpenAI 兼容供应商的 base URL。
func (c *Config) GetLLMBaseURL() string {
	if baseURL := os.Getenv("LLM_BASE_URL"); baseURL != "" {
		return baseURL
	}
	if baseURL := os.Getenv("OPENAI_BASE_URL"); baseURL != "" {
		return baseURL
	}
	return c.RagModelConfig.RagBaseUrl
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func firstEnv(keys ...string) string {
	for _, key := range keys {
		if value := os.Getenv(key); value != "" {
			return value
		}
	}
	return ""
}

func (c *Config) GetChatAPIKey() string {
	return firstNonEmpty(
		firstEnv("CHAT_API_KEY", "DEEPSEEK_API_KEY", "LLM_API_KEY", "OPENAI_API_KEY"),
		c.ChatModelConfig.ApiKey,
		c.RagModelConfig.RagApiKey,
	)
}

func (c *Config) GetChatModelID() string {
	return firstNonEmpty(
		firstEnv("CHAT_MODEL_ID", "DEEPSEEK_MODEL_ID", "LLM_MODEL_ID", "OPENAI_MODEL_NAME"),
		c.ChatModelConfig.ModelName,
		c.RagModelConfig.RagChatModelName,
	)
}

func (c *Config) GetChatBaseURL() string {
	return firstNonEmpty(
		firstEnv("CHAT_BASE_URL", "DEEPSEEK_BASE_URL", "LLM_BASE_URL", "OPENAI_BASE_URL"),
		c.ChatModelConfig.BaseUrl,
		c.RagModelConfig.RagBaseUrl,
	)
}

func (c *Config) GetEmbeddingAPIKey() string {
	return firstNonEmpty(
		firstEnv("EMBEDDING_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"),
		c.EmbeddingModelConfig.ApiKey,
		c.RagModelConfig.RagApiKey,
	)
}

func (c *Config) GetEmbeddingModelID() string {
	return firstNonEmpty(
		firstEnv("EMBEDDING_MODEL_ID", "LLM_EMBEDDING_MODEL"),
		c.EmbeddingModelConfig.ModelName,
		c.RagModelConfig.RagEmbeddingModel,
	)
}

func (c *Config) GetEmbeddingBaseURL() string {
	return firstNonEmpty(
		firstEnv("EMBEDDING_BASE_URL"),
		c.EmbeddingModelConfig.BaseUrl,
		c.RagModelConfig.RagBaseUrl,
	)
}

func (c *Config) GetEmbeddingDimension() int {
	if value := os.Getenv("EMBEDDING_DIMENSION"); value != "" {
		parsed, err := strconv.Atoi(value)
		if err == nil {
			return parsed
		}
	}
	if c.EmbeddingModelConfig.Dimension != 0 {
		return c.EmbeddingModelConfig.Dimension
	}
	return c.RagModelConfig.RagDimension
}

func (c *Config) GetVisionAPIKey() string {
	return firstNonEmpty(
		firstEnv("VISION_API_KEY", "GOOGLE_VISION_API_KEY", "GOOGLE_API_KEY", "GEMINI_API_KEY"),
		c.VisionModelConfig.ApiKey,
		c.EmbeddingModelConfig.ApiKey,
		c.RagModelConfig.RagApiKey,
	)
}

func (c *Config) GetVisionModelID() string {
	return firstNonEmpty(
		firstEnv("VISION_MODEL_ID"),
		c.VisionModelConfig.ModelName,
		c.EmbeddingModelConfig.ModelName,
		c.RagModelConfig.RagChatModelName,
	)
}

func (c *Config) GetVisionBaseURL() string {
	return firstNonEmpty(
		firstEnv("VISION_BASE_URL"),
		c.VisionModelConfig.BaseUrl,
		c.EmbeddingModelConfig.BaseUrl,
		c.RagModelConfig.RagBaseUrl,
	)
}
