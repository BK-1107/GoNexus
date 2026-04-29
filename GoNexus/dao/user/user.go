// Package user 封装用户相关的数据访问方法。
package user

import (
	"GoNexus/common/mysql"
	"GoNexus/model"
	"GoNexus/utils"
	"context"

	"gorm.io/gorm"
)

// 邮件提示文案常量，用于验证码和账号信息通知。
const (
	CodeMsg     = "GoNexus验证码如下(验证码仅限于2分钟有效): "
	UserNameMsg = "GoNexus的账号如下，请保留好，后续可以用账号进行登录 "
)

// ctx 是用户 DAO 层可复用的后台上下文。
var ctx = context.Background()

// 这边只能通过账号进行登录
// IsExistUser 根据用户名判断用户是否存在，并在存在时返回用户信息。
func IsExistUser(username string) (bool, *model.User) {

	user, err := mysql.GetUserByUsername(username)

	if err == gorm.ErrRecordNotFound || user == nil {
		return false, nil
	}

	return true, user
}

// Register 创建新用户，密码会先进行 MD5 加密再写入数据库。
func Register(username, email, password string) (*model.User, bool) {
	if user, err := mysql.InsertUser(&model.User{
		Email:    email,
		Name:     username,
		Username: username,
		Password: utils.MD5(password),
	}); err != nil {
		return nil, false
	} else {
		return user, true
	}
}
