package user

import (
	"GoNexus/common/code"
	myemail "GoNexus/common/email"
	myredis "GoNexus/common/redis"
	"GoNexus/dao/user"
	"GoNexus/model"
	"GoNexus/utils"
	"GoNexus/utils/myjwt"
	"strings"
)

func Login(username, password string) (string, code.Code) {
	var userInformation *model.User
	var ok bool

	if ok, userInformation = user.IsExistUser(username); !ok {
		return "", code.CodeUserNotExist
	}

	if userInformation.Password != utils.MD5(password) {
		return "", code.CodeInvalidPassword
	}

	token, err := myjwt.GenerateToken(userInformation.ID, userInformation.Username)
	if err != nil {
		return "", code.CodeServerBusy
	}

	return token, code.CodeSuccess
}

func Register(email, password, captcha string) (string, code.Code) {
	email = strings.TrimSpace(email)
	captcha = strings.TrimSpace(captcha)
	if email == "" || password == "" || captcha == "" {
		return "", code.CodeInvalidParams
	}

	var ok bool
	var userInformation *model.User

	if ok, _ := user.IsExistUser(email); ok {
		return "", code.CodeUserExist
	}

	if ok, _ := myredis.CheckCaptchaForEmail(email, captcha); !ok {
		return "", code.CodeInvalidCaptcha
	}

	username := utils.GetRandomNumbers(11)
	if userInformation, ok = user.Register(username, email, password); !ok {
		return "", code.CodeServerBusy
	}

	if err := myemail.SendCaptcha(email, username, user.UserNameMsg); err != nil {
		return "", code.CodeServerBusy
	}

	token, err := myjwt.GenerateToken(userInformation.ID, userInformation.Username)
	if err != nil {
		return "", code.CodeServerBusy
	}

	return token, code.CodeSuccess
}

func SendCaptcha(email string) code.Code {
	sendCode := utils.GetRandomNumbers(6)
	if err := myredis.SetCaptchaForEmail(email, sendCode); err != nil {
		return code.CodeServerBusy
	}

	if err := myemail.SendCaptcha(email, sendCode, myemail.CodeMsg); err != nil {
		return code.CodeServerBusy
	}

	return code.CodeSuccess
}
