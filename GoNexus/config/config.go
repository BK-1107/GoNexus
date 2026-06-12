package config

import (
	"log"
	"os"

	"github.com/BurntSushi/toml"
)

type MainConfig struct {
	Port    int    `toml:"port"`
	AppName string `toml:"appName"`
	Host    string `toml:"host"`
}

type EmailConfig struct {
	Authcode string `toml:"authcode"`
	Email    string `toml:"email" `
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
	EmailConfig        `toml:"emailConfig"`
	RedisConfig        `toml:"redisConfig"`
	MysqlConfig        `toml:"mysqlConfig"`
	JwtConfig          `toml:"jwtConfig"`
	MainConfig         `toml:"mainConfig"`
	Rabbitmq           `toml:"rabbitmqConfig"`
	RagModelConfig     `toml:"ragModelConfig"`
	VoiceServiceConfig `toml:"voiceServiceConfig"`
	RegisterConfig     `toml:"registerConfig"`
	DefaultUserConfig  `toml:"defaultUserConfig"`
}

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

// InitConfig 初始化项目配置
func InitConfig() error {
	// 设置配置文件路径（相对于 main.go 所在的目录）
	if _, err := toml.DecodeFile("config/config.toml", config); err != nil {
		log.Fatal(err.Error())
		return err
	}
	return nil
}

func GetConfig() *Config {
	if config == nil {
		config = new(Config)
		_ = InitConfig()
	}
	return config
}

func (c *Config) GetRegisterSecret() string {
	if secret := os.Getenv("GONEXUS_REGISTER_SECRET"); secret != "" {
		return secret
	}
	return c.RegisterConfig.Secret
}

func (c *Config) GetDefaultUsername() string {
	if username := os.Getenv("GONEXUS_DEFAULT_USERNAME"); username != "" {
		return username
	}
	return c.DefaultUserConfig.Username
}

func (c *Config) GetDefaultPassword() string {
	if password := os.Getenv("GONEXUS_DEFAULT_PASSWORD"); password != "" {
		return password
	}
	return c.DefaultUserConfig.Password
}

func (c *Config) GetLLMAPIKey() string {
	if key := os.Getenv("LLM_API_KEY"); key != "" {
		return key
	}
	if key := os.Getenv("OPENAI_API_KEY"); key != "" {
		return key
	}
	return c.RagModelConfig.RagApiKey
}

func (c *Config) GetLLMModelID() string {
	if modelID := os.Getenv("LLM_MODEL_ID"); modelID != "" {
		return modelID
	}
	if modelID := os.Getenv("OPENAI_MODEL_NAME"); modelID != "" {
		return modelID
	}
	return c.RagModelConfig.RagChatModelName
}

func (c *Config) GetLLMBaseURL() string {
	if baseURL := os.Getenv("LLM_BASE_URL"); baseURL != "" {
		return baseURL
	}
	if baseURL := os.Getenv("OPENAI_BASE_URL"); baseURL != "" {
		return baseURL
	}
	return c.RagModelConfig.RagBaseUrl
}
