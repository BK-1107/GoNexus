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
	"log"
)

// 初始化路由，并在指定的地址和端口上启动 HTTP 服务。
func StartServer(addr string, port int) error {
	r := router.InitRouter()
	return r.Run(fmt.Sprintf("%s:%d", addr, port))
}

// 从数据库加载消息并初始化 AIHelperManager会话管理器。
func readDataFromDB() error {
	// 管理多个 AIHelper，helper是多个会话的封装，负责单个会话的上下文和模型调用。
	manager := aihelper.GetGlobalManager()
	// 从数据库读取所有消息
	msgs, err := message.GetAllMessages()
	if err != nil {
		return err
	}
	// 遍历数据库消息
	for i := range msgs {
		m := &msgs[i]
		//默认模型
		modelType := "1"
		config := make(map[string]interface{})

		// 根据用户名和会话 ID，获取或创建一个 AIHelper。
		helper, err := manager.GetOrCreateAIHelper(m.UserName, m.SessionID, modelType, config)
		if err != nil {
			log.Printf("[readDataFromDB] failed to create helper for user=%s session=%s: %v", m.UserName, m.SessionID, err)
			continue
		}
		log.Println("readDataFromDB init:  ", helper.SessionID)
		// 添加消息到内存中，不重新写回数据库
		helper.AddMessage(m.Content, m.UserName, m.IsUser, false)
	}
	log.Println("AIHelperManager init success ")
	return nil
}

func main() {
	conf := config.GetConfig()   // 读配置文件
	host := conf.MainConfig.Host //从配置里拿 HTTP 监听地址和端口
	port := conf.MainConfig.Port
	//初始化mysql
	if err := mysql.InitMysql(); err != nil {
		log.Println("InitMysql error , " + err.Error())
		return
	}
	//初始化AIHelperManager，不return，继续启动服务，避免单点失败
	if err := readDataFromDB(); err != nil {
		log.Println("readDataFromDB error, " + err.Error())
	}

	//初始化redis
	redis.Init()
	log.Println("redis init success  ")
	rabbitmq.InitRabbitMQ()
	log.Println("rabbitmq init success  ")

	err := StartServer(host, port) // 启动 HTTP 服务
	if err != nil {
		panic(err)
	}
}
