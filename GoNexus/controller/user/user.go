package user

import (
	"GoNexus/common/code"
	"GoNexus/controller"
	"GoNexus/service/user"
	"net/http"

	"github.com/gin-gonic/gin"
)

type (
	// LoginRequest 是登录接口的请求结构。
	// Username 这里表示系统生成的账号，Password 是用户密码。
	LoginRequest struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	// LoginResponse 是登录接口的响应结构。
	// omitempty 表示 token 为空时不会输出该字段。
	LoginResponse struct {
		controller.Response
		Token string `json:"token,omitempty"`
	}

	// RegisterRequest 是注册接口的请求结构。
	// 注册流程需要邮箱、邮箱验证码和密码。
	RegisterRequest struct {
		Email    string `json:"email" binding:"required"`
		Captcha  string `json:"captcha" binding:"required"`
		Password string `json:"password" binding:"required"`
	}

	// RegisterResponse 是注册接口的响应结构。
	// 注册成功后直接返回 token，让用户进入登录态。
	RegisterResponse struct {
		controller.Response
		Token string `json:"token,omitempty"`
	}

	// CaptchaRequest 是发送邮箱验证码接口的请求结构。
	CaptchaRequest struct {
		Email string `json:"email" binding:"required"`
	}

	// CaptchaResponse 是发送验证码接口的统一响应结构。
	CaptchaResponse struct {
		controller.Response
	}

	CheckInviteRequest struct {
		InviteCode string `json:"inviteCode" binding:"required"`
	}

	CheckInviteResponse struct {
		controller.Response
	}
)

// Login 处理用户登录请求。
// controller 层负责绑定账号密码参数，真正的账号校验和 token 生成交给 service 层。
func Login(c *gin.Context) {
	req := new(LoginRequest)
	res := new(LoginResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层进行登录，service 层会校验账号密码，并生成 JWT token。
	token, code_ := user.Login(req.Username, req.Password)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	res.Token = token
	c.JSON(http.StatusOK, res)
}

// Register 处理用户注册请求。
// service 层会校验验证码、创建用户、发送账号邮件，并生成登录 token。
func Register(c *gin.Context) {
	req := new(RegisterRequest)
	res := new(RegisterResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层进行注册，service 层会校验验证码、创建用户、发送账号邮件，并生成登录 token。
	token, code_ := user.Register(req.Email, req.Password, req.Captcha)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	res.Token = token
	c.JSON(http.StatusOK, res)
}

// 处理发送邮箱验证码请求。
// controller 只解析邮箱参数，验证码生成、Redis 存储和邮件发送由 service 层完成。
func HandleCaptcha(c *gin.Context) {
	req := new(CaptchaRequest)
	res := new(CaptchaResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 调用 service 层生成验证码、存储 Redis 和发送邮件。
	code_ := user.SendCaptcha(req.Email)
	if code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	c.JSON(http.StatusOK, res)
}

func CheckInvite(c *gin.Context) {
	req := new(CheckInviteRequest)
	res := new(CheckInviteResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	if code_ := user.CheckInviteCode(req.InviteCode); code_ != code.CodeSuccess {
		c.JSON(http.StatusOK, res.CodeOf(code_))
		return
	}

	res.Success()
	c.JSON(http.StatusOK, res)
}
