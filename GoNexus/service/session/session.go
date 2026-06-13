package session

import (
	"GoNexus/common/aihelper"
	"GoNexus/common/code"
	"GoNexus/config"
	daomessage "GoNexus/dao/message"
	daosession "GoNexus/dao/session"
	"GoNexus/model"
	"context"
	"log"
	"net/http"
	"time"

	"github.com/google/uuid"
)

var ctx = context.Background()

func GetUserSessionsByUserName(userName string) ([]model.SessionInfo, error) {
	//获取用户的所有会话ID

	Sessions, err := daosession.GetSessionsByUserName(userName)
	if err != nil {
		return nil, err
	}

	var SessionInfos []model.SessionInfo

	for _, session := range Sessions {
		SessionInfos = append(SessionInfos, model.SessionInfo{
			SessionID: session.ID,
			Title:     session.Title,
		})
	}

	return SessionInfos, nil
}

func CreateSessionAndSendMessage(userName string, userQuestion string, modelType string) (string, string, code.Code) {
	//1：创建一个新的会话
	newSession := &model.Session{
		ID:       uuid.New().String(),
		UserName: userName,
		Title:    userQuestion, // 可以根据需求设置标题，这边暂时用用户第一次的问题作为标题
	}
	createdSession, err := daosession.CreateSession(newSession)
	if err != nil {
		log.Println("CreateSessionAndSendMessage CreateSession error:", err)
		return "", "", code.CodeServerBusy
	}

	//2：获取AIHelper并通过其管理消息
	manager := aihelper.GetGlobalManager()
	config_ := map[string]interface{}{
		"apiKey":   config.GetConfig().GetLLMAPIKey(),
		"username": userName, // 用于 RAG 模型获取用户文档
	}
	helper, err := manager.GetOrCreateAIHelper(userName, createdSession.ID, modelType, config_)
	if err != nil {
		log.Println("CreateSessionAndSendMessage GetOrCreateAIHelper error:", err)
		return "", "", code.AIModelFail
	}

	//3：生成AI回复
	aiResponse, err_ := helper.GenerateResponse(userName, ctx, userQuestion)
	if err_ != nil {
		log.Println("CreateSessionAndSendMessage GenerateResponse error:", err_)
		return "", "", code.AIModelFail
	}

	return createdSession.ID, aiResponse.Content, code.CodeSuccess
}

func CreateStreamSessionOnly(userName string, userQuestion string) (string, code.Code) {
	newSession := &model.Session{
		ID:       uuid.New().String(),
		UserName: userName,
		Title:    userQuestion,
	}
	createdSession, err := daosession.CreateSession(newSession)
	if err != nil {
		log.Println("CreateStreamSessionOnly CreateSession error:", err)
		return "", code.CodeServerBusy
	}
	return createdSession.ID, code.CodeSuccess
}

func StreamMessageToExistingSession(userName string, sessionID string, userQuestion string, modelType string, writer http.ResponseWriter) code.Code {
	start := time.Now()
	log.Printf("StreamMessageToExistingSession start: user=%s session=%s modelType=%s questionLen=%d", userName, sessionID, modelType, len(userQuestion))

	// 确保 writer 支持 Flush
	flusher, ok := writer.(http.Flusher)
	if !ok {
		log.Println("StreamMessageToExistingSession: streaming unsupported")
		return code.CodeServerBusy
	}

	manager := aihelper.GetGlobalManager()
	config_ := map[string]interface{}{
		"apiKey":   config.GetConfig().GetLLMAPIKey(),
		"username": userName, // 用于 RAG 模型获取用户文档
	}
	helper, err := manager.GetOrCreateAIHelper(userName, sessionID, modelType, config_)
	if err != nil {
		log.Println("StreamMessageToExistingSession GetOrCreateAIHelper error:", err)
		return code.AIModelFail
	}

	cb := func(msg string) {
		// 直接发送数据，不转义
		// SSE 格式：data: <content>\n\n
		log.Printf("[SSE] Sending chunk: %s (len=%d)\n", msg, len(msg))
		_, err := writer.Write([]byte("data: " + msg + "\n\n"))
		if err != nil {
			log.Println("[SSE] Write error:", err)
			return
		}
		flusher.Flush() //  每次必须 flush
		log.Println("[SSE] Flushed")
	}

	_, err_ := helper.StreamResponse(userName, ctx, cb, userQuestion)
	if err_ != nil {
		log.Printf("StreamMessageToExistingSession StreamResponse error after %s: %v", time.Since(start), err_)
		return code.AIModelFail
	}

	_, err = writer.Write([]byte("data: [DONE]\n\n"))
	if err != nil {
		log.Println("StreamMessageToExistingSession write DONE error:", err)
		return code.AIModelFail
	}
	flusher.Flush()

	log.Printf("StreamMessageToExistingSession done after %s", time.Since(start))
	return code.CodeSuccess
}

func CreateStreamSessionAndSendMessage(userName string, userQuestion string, modelType string, writer http.ResponseWriter) (string, code.Code) {

	sessionID, code_ := CreateStreamSessionOnly(userName, userQuestion)
	if code_ != code.CodeSuccess {
		return "", code_
	}

	code_ = StreamMessageToExistingSession(userName, sessionID, userQuestion, modelType, writer)
	if code_ != code.CodeSuccess {

		return sessionID, code_
	}

	return sessionID, code.CodeSuccess
}

func ChatSend(userName string, sessionID string, userQuestion string, modelType string) (string, code.Code) {
	//1：获取AIHelper
	manager := aihelper.GetGlobalManager()
	config := map[string]interface{}{
		"username": userName, // 用于 RAG 模型获取用户文档（若当前用户选择了RAG模型，该字段将会被用到）
	}
	helper, err := manager.GetOrCreateAIHelper(userName, sessionID, modelType, config)
	if err != nil {
		log.Println("ChatSend GetOrCreateAIHelper error:", err)
		return "", code.AIModelFail
	}

	//2：生成AI回复
	aiResponse, err_ := helper.GenerateResponse(userName, ctx, userQuestion)
	if err_ != nil {
		log.Println("ChatSend GenerateResponse error:", err_)
		return "", code.AIModelFail
	}

	return aiResponse.Content, code.CodeSuccess
}

func GetChatHistory(userName string, sessionID string) ([]model.History, code.Code) {
	// 1. 尝试从内存获取 (AIHelper)
	manager := aihelper.GetGlobalManager()
	helper, exists := manager.GetAIHelper(userName, sessionID)

	var messages []*model.Message
	if exists {
		messages = helper.GetMessages()
	}

	// 2. 如果内存中没有（或者重启后还没加载到内存），则从数据库加载
	if len(messages) == 0 {
		dbMsgs, err := daomessage.GetMessagesBySessionID(sessionID)
		if err != nil {
			log.Println("GetChatHistory DB error:", err)
			return nil, code.CodeServerBusy
		}
		// 转换为指针切片以统一处理
		for i := range dbMsgs {
			messages = append(messages, &dbMsgs[i])
		}
	}

	// 3. 转换消息为历史格式
	history := make([]model.History, 0, len(messages))
	for _, msg := range messages {
		history = append(history, model.History{
			ID:      msg.ID,
			IsUser:  msg.IsUser,
			Content: msg.Content,
		})
	}

	return history, code.CodeSuccess
}

func ChatStreamSend(userName string, sessionID string, userQuestion string, modelType string, writer http.ResponseWriter) code.Code {

	return StreamMessageToExistingSession(userName, sessionID, userQuestion, modelType, writer)
}

func DeleteSession(userName string, sessionID string) code.Code {
	// 校验会话归属
	session, err := daosession.GetSessionByID(sessionID)
	if err != nil {
		return code.CodeServerBusy
	}
	if session.UserName != userName {
		return code.CodeInvalidParams
	}

	err = daosession.DeleteSessionByID(sessionID)
	if err != nil {
		return code.CodeServerBusy
	}
	return code.CodeSuccess
}

func DeleteMessage(userName string, messageID uint) code.Code {
	msg, err := daomessage.GetMessageByID(messageID)
	if err != nil {
		return code.CodeRecordNotFound
	}
	if msg.UserName != userName {
		return code.CodeInvalidParams
	}

	if err := daomessage.DeleteMessageByID(messageID); err != nil {
		return code.CodeServerBusy
	}

	aihelper.GetGlobalManager().RemoveMessageFromSession(userName, msg.SessionID, messageID)
	return code.CodeSuccess
}
