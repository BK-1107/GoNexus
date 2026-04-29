package controller

import "GoNexus/common/code"

// 是 controller 层统一返回给前端的基础响应结构，`json`:是go的特殊label。
type Response struct {
	StatusCode code.Code `json:"status_code"`
	StatusMsg  string    `json:"status_msg,omitempty"`
}

// 根据业务状态码填充响应对象，主要是错误码
func (r *Response) CodeOf(code code.Code) Response {
	if nil == r {
		r = new(Response) //万一没给盒子分配内存，就临时建一个
	}
	r.StatusCode = code
	r.StatusMsg = code.Msg()
	return *r
}

// 是成功响应的快捷方法，等价于设置 CodeSuccess。
func (r *Response) Success() {
	r.CodeOf(code.CodeSuccess)
}
