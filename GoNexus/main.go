package main

import (
	"GoNexus/common/aihelper"
	"GoNexus/common/mysql"
	"GoNexus/common/rabbitmq"
	"GoNexus/common/redis"
	"GoNexus/config"
	"GoNexus/dao/message"
	"GoNexus/router"
	"fmt"
	"io"
	"log"
	"os"
	"path/filepath"

	"github.com/gin-gonic/gin"
)

func initLogging() (*os.File, error) {
	logDir := os.Getenv("GONEXUS_LOG_DIR")
	if logDir == "" {
		logDir = "logs"
	}
	if err := os.MkdirAll(logDir, 0755); err != nil {
		return nil, err
	}

	logPath := filepath.Join(logDir, "backend.log")
	file, err := os.OpenFile(logPath, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return nil, err
	}

	// 同时写入控制台和 logs/backend.log，方便本地调试和 Docker 日志查看。
	writer := io.MultiWriter(os.Stdout, file)
	log.SetOutput(writer)
	gin.DefaultWriter = writer
	gin.DefaultErrorWriter = io.MultiWriter(os.Stderr, file)
	return file, nil
}

func StartServer(addr string, port int) error {
	r := router.InitRouter()
	return r.Run(fmt.Sprintf("%s:%d", addr, port))
}

func readDataFromDB() error {
	manager := aihelper.GetGlobalManager()
	msgs, err := message.GetAllMessages()
	if err != nil {
		return err
	}

	for i := range msgs {
		m := &msgs[i]
		modelType := "1"
		config := make(map[string]interface{})

		helper, err := manager.GetOrCreateAIHelper(m.UserName, m.SessionID, modelType, config)
		if err != nil {
			log.Printf("[readDataFromDB] failed to create helper for user=%s session=%s: %v", m.UserName, m.SessionID, err)
			continue
		}
		log.Println("readDataFromDB init:  ", helper.SessionID)
		helper.AddMessage(m.Content, m.UserName, m.IsUser, false)
	}

	log.Println("AIHelperManager init success ")
	return nil
}

func main() {
	logFile, err := initLogging()
	if err != nil {
		log.Println("initLogging error, " + err.Error())
		return
	}
	defer logFile.Close()

	conf := config.GetConfig()
	host := conf.MainConfig.Host
	port := conf.MainConfig.Port

	if err := mysql.InitMysql(); err != nil {
		log.Println("InitMysql error , " + err.Error())
		return
	}

	if err := readDataFromDB(); err != nil {
		log.Println("readDataFromDB error, " + err.Error())
	}

	redis.Init()
	log.Println("redis init success  ")
	rabbitmq.InitRabbitMQ()
	log.Println("rabbitmq init success  ")

	if err := StartServer(host, port); err != nil {
		panic(err)
	}
}
