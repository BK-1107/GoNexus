package session

import (
	"GoNexus/common/aihelper"
	"GoNexus/common/code"
	"GoNexus/config"
	daomessage "GoNexus/dao/message"
	daosession "GoNexus/dao/session"
	"GoNexus/model"
	"context"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/google/uuid"
)

var ctx = context.Background()
var unsafePathChars = regexp.MustCompile(`[^a-zA-Z0-9._-]+`)

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
		"apiKey":   config.GetConfig().GetChatAPIKey(),
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

func ImportSession(userName string, title string, messages []model.History) (model.SessionInfo, code.Code) {
	title = strings.TrimSpace(title)
	if title == "" {
		title = "Imported Chat"
	}
	titleRunes := []rune(title)
	if len(titleRunes) > 100 {
		title = string(titleRunes[:100])
	}
	if len(messages) == 0 {
		return model.SessionInfo{}, code.CodeInvalidParams
	}

	cleanMessages := make([]model.History, 0, len(messages))
	for _, item := range messages {
		content := strings.TrimSpace(item.Content)
		if content == "" {
			continue
		}
		cleanMessages = append(cleanMessages, model.History{
			IsUser:  item.IsUser,
			Content: content,
		})
	}
	if len(cleanMessages) == 0 {
		return model.SessionInfo{}, code.CodeInvalidParams
	}

	newSession := &model.Session{
		ID:       uuid.New().String(),
		UserName: userName,
		Title:    title,
	}
	if _, err := daosession.CreateSession(newSession); err != nil {
		log.Println("ImportSession CreateSession error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	for _, item := range cleanMessages {
		if _, err := daomessage.CreateMessage(&model.Message{
			SessionID: newSession.ID,
			UserName:  userName,
			Content:   item.Content,
			IsUser:    item.IsUser,
		}); err != nil {
			log.Println("ImportSession CreateMessage error:", err)
			return model.SessionInfo{}, code.CodeServerBusy
		}
	}

	return model.SessionInfo{
		SessionID: newSession.ID,
		Title:     newSession.Title,
	}, code.CodeSuccess
}

func CreateVisionMemorySession(userName string, imageFile *multipart.FileHeader, result string) (model.SessionInfo, code.Code) {
	result = strings.TrimSpace(result)
	if imageFile == nil || result == "" {
		return model.SessionInfo{}, code.CodeInvalidParams
	}

	contentType := imageFile.Header.Get("Content-Type")
	if !strings.HasPrefix(contentType, "image/") {
		return model.SessionInfo{}, code.CodeInvalidParams
	}

	safeUser := sanitizePathSegment(userName)
	originalFileName := filepath.Base(strings.ReplaceAll(imageFile.Filename, "\\", "/"))
	if strings.TrimSpace(originalFileName) == "" || originalFileName == "." {
		originalFileName = "image"
	}

	title := "image memory " + originalFileName
	titleRunes := []rune(title)
	if len(titleRunes) > 100 {
		title = string(titleRunes[:100])
	}

	newSession := &model.Session{
		ID:       uuid.New().String(),
		UserName: userName,
		Title:    title,
	}
	if _, err := daosession.CreateSession(newSession); err != nil {
		log.Println("CreateVisionMemorySession CreateSession error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	uploadDir := filepath.Join("uploads", "vision", safeUser, newSession.ID)
	if err := os.MkdirAll(uploadDir, 0755); err != nil {
		log.Println("CreateVisionMemorySession MkdirAll error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	ext := strings.ToLower(filepath.Ext(originalFileName))
	if ext == "" || len(ext) > 10 {
		ext = ".img"
	}
	storedFileName := uuid.New().String() + ext
	storedPath := filepath.Join(uploadDir, storedFileName)
	src, err := imageFile.Open()
	if err != nil {
		log.Println("CreateVisionMemorySession Open image error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}
	defer src.Close()

	dst, err := os.Create(storedPath)
	if err != nil {
		log.Println("CreateVisionMemorySession Create image error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}
	defer dst.Close()

	if _, err := dst.ReadFrom(src); err != nil {
		log.Println("CreateVisionMemorySession Save image error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	publicPath := "/" + filepath.ToSlash(storedPath)
	userContent := fmt.Sprintf("Uploaded image: %s\n\n![%s](%s)", originalFileName, originalFileName, publicPath)
	if _, err := daomessage.CreateMessage(&model.Message{
		SessionID: newSession.ID,
		UserName:  userName,
		Content:   userContent,
		IsUser:    true,
	}); err != nil {
		log.Println("CreateVisionMemorySession Create user message error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	if _, err := daomessage.CreateMessage(&model.Message{
		SessionID: newSession.ID,
		UserName:  userName,
		Content:   "Image recognition result:\n\n" + result,
		IsUser:    false,
	}); err != nil {
		log.Println("CreateVisionMemorySession Create assistant message error:", err)
		return model.SessionInfo{}, code.CodeServerBusy
	}

	return model.SessionInfo{
		SessionID: newSession.ID,
		Title:     newSession.Title,
	}, code.CodeSuccess
}

func sanitizePathSegment(value string) string {
	value = strings.TrimSpace(value)
	value = unsafePathChars.ReplaceAllString(value, "_")
	value = strings.Trim(value, "._-")
	if value == "" {
		return "unknown"
	}
	return value
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
		"apiKey":   config.GetConfig().GetChatAPIKey(),
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
	session, err := daosession.GetSessionByID(sessionID)
	if err != nil {
		return nil, code.CodeRecordNotFound
	}
	if session.UserName != userName {
		return nil, code.CodeForbidden
	}

	// 1. 尝试从内存获取 (AIHelper)
	manager := aihelper.GetGlobalManager()
	helper, exists := manager.GetAIHelper(userName, sessionID)

	var messages []*model.Message
	if exists {
		messages = helper.GetMessages()
	}

	shouldLoadFromDB := len(messages) == 0
	for _, msg := range messages {
		if msg.ID == 0 {
			shouldLoadFromDB = true
			break
		}
	}

	// 2. 如果内存中没有，或内存消息还没有数据库 ID，则从数据库加载
	if shouldLoadFromDB {
		messages = nil
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

func ExtractChatMemory(userName string, sessionID string) (string, []model.History, code.Code) {
	history, code_ := GetChatHistory(userName, sessionID)
	if code_ != code.CodeSuccess {
		return "", nil, code_
	}

	var builder strings.Builder
	for _, msg := range history {
		role := "assistant"
		if msg.IsUser {
			role = "user"
		}
		builder.WriteString("### ")
		builder.WriteString(role)
		builder.WriteString("\n")
		builder.WriteString(strings.TrimSpace(msg.Content))
		builder.WriteString("\n\n")
	}

	return strings.TrimSpace(builder.String()), history, code.CodeSuccess
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
		return code.CodeForbidden
	}

	if err := daomessage.DeleteMessagesBySessionID(sessionID); err != nil {
		return code.CodeServerBusy
	}
	if err := daosession.DeleteSessionByID(sessionID); err != nil {
		return code.CodeServerBusy
	}
	visionDir := filepath.Join("uploads", "vision", sanitizePathSegment(userName), sessionID)
	if err := os.RemoveAll(visionDir); err != nil {
		log.Println("DeleteSession RemoveAll vision assets error:", err)
	}
	aihelper.GetGlobalManager().RemoveAIHelper(userName, sessionID)
	return code.CodeSuccess
}

func DeleteMessage(userName string, messageID uint) code.Code {
	msg, err := daomessage.GetMessageByID(messageID)
	if err != nil {
		return code.CodeRecordNotFound
	}
	if msg.UserName != userName {
		return code.CodeForbidden
	}

	if err := daomessage.DeleteMessageByID(messageID); err != nil {
		return code.CodeServerBusy
	}

	aihelper.GetGlobalManager().RemoveMessageFromSession(userName, msg.SessionID, messageID)
	return code.CodeSuccess
}

func UpdateMessage(userName string, messageID uint, content string) code.Code {
	content = strings.TrimSpace(content)
	if content == "" {
		return code.CodeInvalidParams
	}

	msg, err := daomessage.GetMessageByID(messageID)
	if err != nil {
		return code.CodeRecordNotFound
	}
	if msg.UserName != userName {
		return code.CodeForbidden
	}

	if err := daomessage.UpdateMessageContentByID(messageID, content); err != nil {
		return code.CodeServerBusy
	}

	aihelper.GetGlobalManager().UpdateMessageInSession(userName, msg.SessionID, messageID, content)
	return code.CodeSuccess
}
