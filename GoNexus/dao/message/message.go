// Package message 封装消息相关的数据访问方法。
package message

import (
	"GoNexus/common/mysql"
	"GoNexus/model"
)

// GetMessagesBySessionID 根据单个会话 ID 查询该会话下的消息，并按创建时间升序返回。
func GetMessagesBySessionID(sessionID string) ([]model.Message, error) {
	var msgs []model.Message
	err := mysql.DB.Where("session_id = ?", sessionID).Order("created_at asc").Find(&msgs).Error
	return msgs, err
}

// GetMessagesBySessionIDs 根据多个会话 ID 批量查询消息，并按创建时间升序返回。
func GetMessagesBySessionIDs(sessionIDs []string) ([]model.Message, error) {
	var msgs []model.Message
	if len(sessionIDs) == 0 {
		return msgs, nil
	}
	err := mysql.DB.Where("session_id IN ?", sessionIDs).Order("created_at asc").Find(&msgs).Error
	return msgs, err
}

// CreateMessage 创建一条新的消息记录，并返回写入后的消息对象。
func CreateMessage(message *model.Message) (*model.Message, error) {
	err := mysql.DB.Create(message).Error
	return message, err
}

// GetAllMessages 查询所有消息，并按创建时间升序返回。
func GetAllMessages() ([]model.Message, error) {
	var msgs []model.Message
	err := mysql.DB.Order("created_at asc").Find(&msgs).Error
	return msgs, err
}

func GetMessageByID(id uint) (*model.Message, error) {
	var msg model.Message
	err := mysql.DB.First(&msg, id).Error
	return &msg, err
}

func DeleteMessageByID(id uint) error {
	return mysql.DB.Delete(&model.Message{}, id).Error
}

func UpdateMessageContentByID(id uint, content string) error {
	return mysql.DB.Model(&model.Message{}).Where("id = ?", id).Update("content", content).Error
}

func DeleteMessagesBySessionID(sessionID string) error {
	return mysql.DB.Where("session_id = ?", sessionID).Delete(&model.Message{}).Error
}
