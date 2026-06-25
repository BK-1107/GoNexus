package code

//code响应状态码

type Code int64

const (
	CodeSuccess Code = 1000

	CodeInvalidParams    Code = 2001
	CodeUserExist        Code = 2002
	CodeUserNotExist     Code = 2003
	CodeInvalidPassword  Code = 2004
	CodeNotMatchPassword Code = 2005
	CodeInvalidToken     Code = 2006
	CodeNotLogin         Code = 2007
	CodeInvalidCaptcha   Code = 2008
	CodeRecordNotFound   Code = 2009
	CodeIllegalPassword  Code = 2010

	CodeForbidden Code = 3001

	CodeServerBusy Code = 4001

	AIModelNotFind    Code = 5001
	AIModelCannotOpen Code = 5002
	AIModelFail       Code = 5003

	TTSFail Code = 6001
)

var msg = map[Code]string{
	CodeSuccess: "success",

	CodeInvalidParams:    "Invalid request parameters",
	CodeUserExist:        "Username already exists",
	CodeUserNotExist:     "User does not exist",
	CodeInvalidPassword:  "Invalid username or password",
	CodeNotMatchPassword: "Passwords do not match",
	CodeInvalidToken:     "Invalid or expired token",
	CodeNotLogin:         "Please log in first",
	CodeInvalidCaptcha:   "Invalid captcha",
	CodeRecordNotFound:   "Record not found",
	CodeIllegalPassword:  "Invalid password format",

	CodeForbidden: "Permission denied",

	CodeServerBusy: "Service is busy",

	AIModelNotFind:    "Model not found",
	AIModelCannotOpen: "Unable to open model",
	AIModelFail:       "Model execution failed",
	TTSFail:           "Text-to-speech service failed",
}

func (code Code) Code() int64 {
	return int64(code)
}

// Msg 获取响应消息
func (code Code) Msg() string {
	if m, ok := msg[code]; ok {
		return m
	}
	return msg[CodeServerBusy]
}
