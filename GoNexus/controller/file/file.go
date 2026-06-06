package file

import (
	"GoNexus/common/code"
	"GoNexus/controller"
	"GoNexus/service/file"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// FilePath 返回服务端保存后的文件路径，Response 负责统一状态码和提示信息。
type UploadFileResponse struct {
	FilePath string `json:"file_path,omitempty"`
	controller.Response
}

// 读http取传来的上传的文件
func UploadRagFile(c *gin.Context) {
	res := new(UploadFileResponse)

	// 读取上传文件，把文件实体抽出来
	uploadedFile, err := c.FormFile("file")
	if err != nil {
		log.Println("FormFile fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	// 从上下文环境里，把解密后的纯文字名字拿出来
	username := c.GetString("userName")
	if username == "" {
		log.Println("Username not found in context")
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidToken))
		return
	}

	// 转移service 层，完成文件类型校验、保存文件，以及文本类文件的 RAG 索引构建。
	filePath, err := file.UploadRagFile(username, uploadedFile)
	if err != nil {
		log.Println("UploadFile fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeServerBusy))
		return
	}
	// 返回文件路径给前端，gin不需要return。
	res.Success()
	res.FilePath = filePath
	c.JSON(http.StatusOK, res)
}

// 处理知识库文件删除请求。删除逻辑交给 service 层。
func DeleteKnowledgeFile(c *gin.Context) {
	res := new(controller.Response)

	filename := c.Query("filename")
	username := c.GetString("userName")

	if filename == "" {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 删除文件的业务逻辑在 service 层实现，controller 只负责调用和返回结果。
	err := file.DeleteKnowledgeFile(username, filename)
	if err != nil {
		log.Println("DeleteKnowledgeFile fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeServerBusy))
		return
	}
	// 删除成功，返回成功状态码和消息。
	res.Success()
	c.JSON(http.StatusOK, res)
}
