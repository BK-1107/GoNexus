package router

import (
	"GoNexus/controller/user"

	"github.com/gin-gonic/gin"
)

// 注册用户相关的路由
func RegisterUserRouter(r *gin.RouterGroup) {
	{
		r.POST("/register", user.Register)
		r.POST("/login", user.Login)
		r.POST("/captcha", user.HandleCaptcha)
		r.POST("/check-invite", user.CheckInvite)
	}
}
