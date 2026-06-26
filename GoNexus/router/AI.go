package router

import (
	"GoNexus/controller/session"
	"GoNexus/controller/tts"

	"github.com/gin-gonic/gin"
)

// 路由，哪个 URL 请求，交给哪个 controller 函数处理。
func AIRouter(r *gin.RouterGroup) {
	{
		// 聊天相关接口
		r.GET("/chat/sessions", session.GetUserSessionsByUserName)
		r.POST("/chat/send-new-session", session.CreateSessionAndSendMessage)
		r.POST("/chat/send", session.ChatSend)
		r.POST("/chat/history", session.ChatHistory)
		r.POST("/chat/memory", session.ExtractChatMemory)
		r.POST("/chat/session/import", session.ImportSession)
		r.POST("/chat/session/from-vision", session.CreateVisionMemorySession)

		// TTS相关接口
		r.POST("/chat/tts", tts.CreateTTSTask)
		r.GET("/chat/tts/query", tts.QueryTTSTask)
		r.POST("/chat/send-stream-new-session", session.CreateStreamSessionAndSendMessage)
		r.POST("/chat/send-stream", session.ChatStreamSend)
		r.DELETE("/chat/session/:id", session.DeleteSession)
		r.PUT("/chat/message/:id", session.UpdateMessage)
		r.DELETE("/chat/message/:id", session.DeleteMessage)
	}

}
