package session

import (
	"GoNexus/common/code"
	"GoNexus/controller"
	"GoNexus/model"
	"GoNexus/service/session"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type (
	// 是查询当前用户所有聊天会话的响应结构，新盒子
	GetUserSessionsResponse struct {
		controller.Response
		Sessions []model.SessionInfo `json:"sessions,omitempty"`
	}

	// 新建会话并发送第一条消息的请求结构。
	CreateSessionAndSendMessageRequest struct {
		UserQuestion string `json:"question" binding:"required"`  // 用户问题
		ModelType    string `json:"modelType" binding:"required"` // 使用的模型类型
	}

	// 返回 AI 回复和新创建的会话 ID。
	CreateSessionAndSendMessageResponse struct {
		AiInformation string `json:"Information,omitempty"` // AI 回复内容
		SessionID     string `json:"sessionId,omitempty"`   // 当前会话 ID
		controller.Response
	}

	// 向已有会话发送消息的请求结构。
	ChatSendRequest struct {
		UserQuestion string `json:"question" binding:"required"`            // 用户问题
		ModelType    string `json:"modelType" binding:"required"`           // 使用的模型类型
		SessionID    string `json:"sessionId,omitempty" binding:"required"` // 当前会话 ID
	}

	// 普通非流式聊天接口的响应结构。
	ChatSendResponse struct {
		AiInformation string `json:"Information,omitempty"` // AI 回复内容
		controller.Response
	}

	// 查询某个会话历史记录的请求结构。
	ChatHistoryRequest struct {
		SessionID string `json:"sessionId,omitempty" binding:"required"` // 当前会话 ID
	}

	// 返回当前会话的历史消息列表。
	ChatHistoryResponse struct {
		History []model.History `json:"history"`
		controller.Response
	}

	ChatMemoryResponse struct {
		Memory  string          `json:"memory"`
		History []model.History `json:"history"`
		controller.Response
	}

	UpdateMessageRequest struct {
		Content string `json:"content" binding:"required"`
	}

	ImportSessionRequest struct {
		Title    string          `json:"title"`
		Messages []model.History `json:"messages" binding:"required"`
	}

	ImportSessionResponse struct {
		Session model.SessionInfo `json:"session"`
		controller.Response
	}
)

// 查询当前登录用户的所有聊天会话。
func GetUserSessionsByUserName(c *gin.Context) {
	res := new(GetUserSessionsResponse)
	userName := c.GetString("userName") // 来自 JWT 中间件
	// 调用 service 层查询会话列表，根据 userName 从数据库查询。
	userSessions, err := session.GetUserSessionsByUserName(userName)
	if err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeServerBusy))
		return
	}

	res.Success()
	res.Sessions = userSessions
	c.JSON(http.StatusOK, res)
}

// 创建新会话，并在该会话中发送第一条用户消息。
// controller 层负责参数绑定和响应包装，具体创建会话和调用 AI 的逻辑在 service 层。
func CreateSessionAndSendMessage(c *gin.Context) {
	req := new(CreateSessionAndSendMessageRequest)
	res := new(CreateSessionAndSendMessageResponse)

	userName := c.GetString("userName")
	// 参数绑定，确保前端传了 question 和 modelType。
	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层创建会话并发送消息，得到 AI 回复和新会话 ID。
	sessionID, aiInformation, code_ := session.CreateSessionAndSendMessage(userName, req.UserQuestion, req.ModelType)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}
	res.Success()
	res.AiInformation = aiInformation
	res.SessionID = sessionID
	c.JSON(http.StatusOK, res)
}

// 创建新会话，并通过 SSE 流式返回 AI 回复。
// 它会先把 sessionId 推给前端，让前端可以立即显示新会话，再继续推送 AI 输出内容。
func CreateStreamSessionAndSendMessage(c *gin.Context) {
	req := new(CreateSessionAndSendMessageRequest)
	userName := c.GetString("userName")

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, gin.H{"error": "Invalid parameters"})
		return
	}

	// 设置 SSE 响应头，告诉客户端这是一个持续输出的事件流。
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")

	// 先创建会话，保证前端可以立刻拿到 sessionId。
	sessionID, code_ := session.CreateStreamSessionOnly(userName, req.UserQuestion)
	if code_ != code.CodeSuccess {
		c.SSEvent("error", gin.H{"message": "Failed to create session"})
		return
	}

	// 先把 sessionId 下发给前端，前端可以据此绑定当前新会话。
	c.Writer.WriteString(fmt.Sprintf("data: {\"sessionId\": \"%s\"}\n\n", sessionID))
	c.Writer.Flush()

	// 再开始把本次 AI 回复按 SSE 流式输出。
	code_ = session.StreamMessageToExistingSession(userName, sessionID, req.UserQuestion, req.ModelType, http.ResponseWriter(c.Writer))
	if code_ != code.CodeSuccess {
		c.SSEvent("error", gin.H{"message": "Failed to send message"})
		c.Writer.Flush()
		return
	}
}

// ChatSend 向已有会话发送一条普通消息，并一次性返回 AI 回复。
func ChatSend(c *gin.Context) {
	req := new(ChatSendRequest)
	res := new(ChatSendResponse)
	userName := c.GetString("userName")

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层处理消息发送和 AI 回复，得到 AI 回复内容。
	aiInformation, code_ := session.ChatSend(userName, req.SessionID, req.UserQuestion, req.ModelType)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}
	// 返回 AI 回复给前端，前端可以更新界面显示 AI 回复内容。
	res.Success()
	res.AiInformation = aiInformation
	c.JSON(http.StatusOK, res)
}

// ChatStreamSend 向已有会话发送消息，并通过 SSE 流式返回 AI 回复。
func ChatStreamSend(c *gin.Context) {
	req := new(ChatSendRequest)
	userName := c.GetString("userName") // 来自 JWT 中间件

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, gin.H{"error": "Invalid parameters"})
		return
	}

	// 设置 SSE 响应头，避免代理缓存并保持连接不断开。
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")
	c.Header("X-Accel-Buffering", "no")
	// 调用 service 层处理消息发送和 AI 回复，AI 回复会通过 http.ResponseWriter 以 SSE 形式持续输出。
	code_ := session.ChatStreamSend(userName, req.SessionID, req.UserQuestion, req.ModelType, http.ResponseWriter(c.Writer))
	if code_ != code.CodeSuccess {
		c.SSEvent("error", gin.H{"message": "Failed to send message"})
		c.Writer.Flush()
		return
	}
}

// ChatHistory 查询当前用户指定会话的历史聊天记录。
func ChatHistory(c *gin.Context) {
	req := new(ChatHistoryRequest)
	res := new(ChatHistoryResponse)
	userName := c.GetString("userName")

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层查询历史记录，service 层会校验会话是否属于当前用户。
	history, code_ := session.GetChatHistory(userName, req.SessionID)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	res.History = history
	c.JSON(http.StatusOK, res)
}

func ExtractChatMemory(c *gin.Context) {
	req := new(ChatHistoryRequest)
	res := new(ChatMemoryResponse)
	userName := c.GetString("userName")

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	memory, history, code_ := session.ExtractChatMemory(userName, req.SessionID)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	res.Memory = memory
	res.History = history
	c.JSON(http.StatusOK, res)
}

func ImportSession(c *gin.Context) {
	req := new(ImportSessionRequest)
	res := new(ImportSessionResponse)
	userName := c.GetString("userName")

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	importedSession, code_ := session.ImportSession(userName, req.Title, req.Messages)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	res.Session = importedSession
	c.JSON(http.StatusOK, res)
}

// DeleteSession 删除当前用户的指定会话。
func DeleteSession(c *gin.Context) {
	sessionID := c.Param("id")
	userName := c.GetString("userName")
	// 调用 service 层删除会话，service 层会校验会话是否属于当前用户。
	code_ := session.DeleteSession(userName, sessionID)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, gin.H{"status_code": code_, "status_msg": "Delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status_code": code.CodeSuccess, "status_msg": "Success"})
}

func DeleteMessage(c *gin.Context) {
	messageID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status_code": code.CodeInvalidParams, "status_msg": "Invalid message id"})
		return
	}

	userName := c.GetString("userName")
	code_ := session.DeleteMessage(userName, uint(messageID))
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, gin.H{"status_code": code_, "status_msg": "Delete failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status_code": code.CodeSuccess, "status_msg": "Success"})
}

func UpdateMessage(c *gin.Context) {
	messageID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status_code": code.CodeInvalidParams, "status_msg": "Invalid message id"})
		return
	}

	req := new(UpdateMessageRequest)
	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, gin.H{"status_code": code.CodeInvalidParams, "status_msg": "Invalid parameters"})
		return
	}

	userName := c.GetString("userName")
	code_ := session.UpdateMessage(userName, uint(messageID), req.Content)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, gin.H{"status_code": code_, "status_msg": "Update failed"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status_code": code.CodeSuccess, "status_msg": "Success"})
}
