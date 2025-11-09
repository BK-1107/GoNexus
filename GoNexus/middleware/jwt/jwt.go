package jwt

import (
	"GoNexus/common/code"
	"GoNexus/controller"
	"GoNexus/utils/myjwt" //自己写的 JWT 工具包，用来解析 token
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// Auth 是 Gin 的 JWT 鉴权中间件。
// 它会从请求头或 URL 参数中读取 token，校验通过后把用户名写入上下文。
func Auth() gin.HandlerFunc {
	return func(c *gin.Context) {
		res := new(controller.Response)
		var token string

		// 优先从 Authorization 请求头中读取 token，格式为：Bearer <token>。
		authHeader := c.GetHeader("Authorization")
		if authHeader != "" && strings.HasPrefix(authHeader, "Bearer ") {
			token = strings.TrimPrefix(authHeader, "Bearer ")
		} else {
			// 兼容 SSE 等场景：通过 URL 查询参数传 token
			// 例如：GET /stream?token=xxx
			token = c.Query("token")
		}

		if token == "" {
			// 没有 token，直接中断请求。返回http状态码与错误码，json格式
			c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidToken))
			c.Abort()
			return
		}

		log.Println("token is ", token)
		// 解析 token，获取用户名
		userName, ok := myjwt.ParseToken(token)
		if !ok {
			// ok==false 代表 token 无效或过期，返回无效 token。
			c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidToken))
			c.Abort()
			return
		}

		// 把解析出的用户名放进 Gin 上下文，后续 controller 可以通过 c.GetString("userName") 获取。
		c.Set("userName", userName)
		c.Next()
	}
}
