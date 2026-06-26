package image

import (
	"GoNexus/common/code"
	"GoNexus/controller"
	"GoNexus/service/image"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type (
	// class保存 AI 视觉模型返回的图片描述或识别结果，拓展。
	RecognizeImageResponse struct {
		ClassName string `json:"class_name,omitempty"`
		controller.Response
	}

	GeneratePromptRequest struct {
		Analysis string `json:"analysis" binding:"required"`
		Target   string `json:"target"`
	}

	GeneratePromptResponse struct {
		Prompt string `json:"prompt,omitempty"`
		controller.Response
	}
)

// 处理图片识别请求，具体的图片分析逻辑交给 service 层。
func RecognizeImage(c *gin.Context) {
	res := new(RecognizeImageResponse)

	// 从表单字段 image 中读取上传图片。
	file, err := c.FormFile("image")
	if err != nil {
		log.Println("FormFile fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	// 调用 service 层，把图片交给 AI 视觉模型分析。
	className, err := image.RecognizeImage(file)
	if err != nil {
		log.Println("RecognizeImage fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeServerBusy))
		return
	}

	res.Success()
	res.ClassName = className
	c.JSON(http.StatusOK, res)
}

func GeneratePrompt(c *gin.Context) {
	req := new(GeneratePromptRequest)
	res := new(GeneratePromptResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	generated, err := image.GeneratePromptFromAnalysis(req.Analysis)
	if err != nil {
		log.Println("GeneratePrompt fail ", err)
		c.JSON(http.StatusOK, res.CodeOf(code.CodeServerBusy))
		return
	}

	res.Success()
	res.Prompt = generated.Prompt
	c.JSON(http.StatusOK, res)
}
