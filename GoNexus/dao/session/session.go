// Package session 封装会话相关的数据访问方法。
package session

import (
	"GoNexus/common/mysql"
	"GoNexus/model"
)

// GetSessionsByUserName 根据用户名查询该用户的所有会话。
func GetSessionsByUserName(UserName string) ([]model.Session, error) {
	var sessions []model.Session
	err := mysql.DB.Where("user_name = ?", UserName).Find(&sessions).Error
	return sessions, err
}

// CreateSession 创建一条新的会话记录，并返回写入后的会话对象。
func CreateSession(session *model.Session) (*model.Session, error) {
	err := mysql.DB.Create(session).Error
	return session, err
}

// GetSessionByID 根据会话 ID 查询单条会话记录。
func GetSessionByID(sessionID string) (*model.Session, error) {
	var session model.Session
	err := mysql.DB.Where("id = ?", sessionID).First(&session).Error
	return &session, err
}

// DeleteSessionByID 根据会话 ID 删除对应的会话记录。
func DeleteSessionByID(sessionID string) error {
	return mysql.DB.Where("id = ?", sessionID).Delete(&model.Session{}).Error
}
