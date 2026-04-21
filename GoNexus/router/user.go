package router

import (
	"GopherAI/controller/user"

	"github.com/gin-gonic/gin"
)

func RegisterUserRouter(r *gin.RouterGroup) {
	{
		r.POST("/register", user.Register)
		r.POST("/login", user.Login)
		r.POST("/captcha", user.HandleCaptcha)
	}
}

//你可以把它理解成一张“映射表”：
// URL                → 处理函数
//--------------------------------
// /register          → Register
// /login             → Login
// /captcha           → HandleCaptcha
