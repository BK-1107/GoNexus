package utils

import (
	"GoNexus/model"
	"crypto/md5"
	"encoding/hex"
	"fmt"
	"math/rand"
	"mime/multipart"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/cloudwego/eino/schema"
	"github.com/google/uuid"
)

// GetRandomNumbers 生成指定长度的纯数字随机字符串，常用于邮箱验证码。
func GetRandomNumbers(num int) string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))

	code := ""
	for i := 0; i < num; i++ {
		// 生成 0~9 的随机数字并拼接成验证码。
		digit := r.Intn(10)
		code += strconv.Itoa(digit)
	}
	return code
}

// MD5 对字符串做 MD5 哈希，常用于密码摘要或简单标识生成。
func MD5(str string) string {
	m := md5.New()
	m.Write([]byte(str))
	return hex.EncodeToString(m.Sum(nil))
}

// GenerateUUID 生成一个全局唯一 ID，可用于文件名、会话 ID 或任务 ID。
func GenerateUUID() string {
	return uuid.New().String()
}

// ConvertToModelMessage 将 AI 模型返回的 schema.Message 转成项目自己的数据库消息结构。
func ConvertToModelMessage(sessionID string, userName string, msg *schema.Message) *model.Message {
	return &model.Message{
		SessionID: sessionID,
		UserName:  userName,
		Content:   msg.Content,
	}
}

// AIHelper 调用模型前会使用它把历史上下文转换成模型可识别的格式。
func ConvertToSchemaMessages(msgs []*model.Message) []*schema.Message {
	schemaMsgs := make([]*schema.Message, 0, len(msgs))
	for _, m := range msgs {
		role := schema.Assistant
		if m.IsUser {
			role = schema.User
		}
		schemaMsgs = append(schemaMsgs, &schema.Message{
			Role:    role,
			Content: m.Content,
		})
	}
	return schemaMsgs
}

// 删除指定目录下的普通文件，但不会删除子目录。。
func RemoveAllFilesInDir(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}
	for _, entry := range entries {
		if !entry.IsDir() { // 只删除普通文件，保留子目录。
			filePath := filepath.Join(dir, entry.Name())
			if err := os.Remove(filePath); err != nil {
				return err
			}
		}
	}
	return nil
}

// 当前支持文本、PDF、Word 和常见图片格式，用于文件上传和 RAG 知识库导入前的基础检查。
func ValidateFile(file *multipart.FileHeader) error {
	ext := strings.ToLower(filepath.Ext(file.Filename))

	allowedExtensions := map[string]bool{
		".md":   true,
		".txt":  true,
		".pdf":  true,
		".doc":  true,
		".docx": true,
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}
	if !allowedExtensions[ext] {
		return fmt.Errorf("文件类型不正确，当前扩展名: %s", ext)
	}
	return nil
}

// TruncateString 截断过长字符串，常用于日志里展示内容预览，避免日志过长。
func TruncateString(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n] + "..."
}
