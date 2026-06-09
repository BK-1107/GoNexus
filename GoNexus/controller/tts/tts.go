package tts

import (
	"GoNexus/common/code"
	"GoNexus/common/tts"
	"GoNexus/controller"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

type (
	// TTSRequest 是创建语音合成任务的请求结构。
	// Text 是需要转换成语音的文本内容。
	TTSRequest struct {
		Text string `json:"text,omitempty"`
	}

	// TTSResponse 是创建任务后的响应结构。
	// TaskID 用于前端后续轮询查询语音合成结果。
	TTSResponse struct {
		TaskID string `json:"task_id,omitempty"`
		controller.Response
	}

	// QueryTTSResponse 是查询语音合成任务状态的响应结构。
	// 成功时 TaskResult 会保存语音文件 URL。
	QueryTTSResponse struct {
		TaskID     string `json:"task_id,omitempty"`
		TaskStatus string `json:"task_status,omitempty"`
		TaskResult string `json:"task_result,omitempty"`
		controller.Response
	}
)

// TTSServices 包装 common/tts 中的 TTSService，方便 controller 调用语音服务。
type TTSServices struct {
	ttsService *tts.TTSService
}

// NewTTSServices 创建 TTS controller 使用的服务对象。
func NewTTSServices() *TTSServices {
	return &TTSServices{
		ttsService: tts.NewTTSService(),
	}
}

// CreateTTSTask 创建语音合成任务。
// controller 层负责读取文本参数，真正调用第三方 TTS 服务的逻辑在 common/tts 中。
func CreateTTSTask(c *gin.Context) {
	tts := NewTTSServices()
	req := new(TTSRequest)
	res := new(TTSResponse)

	if err := c.ShouldBindJSON(req); err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	if req.Text == "" {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}

	// 创建 TTS 任务并返回 taskID，前端拿到 taskID 后再轮询查询合成结果。
	taskID, err := tts.ttsService.CreateTTS(c, req.Text)
	if err != nil {
		c.JSON(http.StatusOK, res.CodeOf(code.TTSFail))
		return
	}
	res.Success()
	res.TaskID = taskID
	c.JSON(http.StatusOK, res)
}

// QueryTTSTask 查询语音合成任务状态。
// 前端通过 task_id 查询任务是否完成，完成后会拿到语音文件 URL。
func QueryTTSTask(c *gin.Context) {
	tts := NewTTSServices()
	res := new(QueryTTSResponse)

	taskID := c.Query("task_id")
	if taskID == "" {
		c.JSON(http.StatusOK, res.CodeOf(code.CodeInvalidParams))
		return
	}
	// 查询 TTS 任务状态和结果，service 层会调用第三方 TTS 服务的查询接口。
	TTSQueryResponse, err := tts.ttsService.QueryTTSFull(c, taskID)
	if err != nil {
		log.Println("语音合成失败", err.Error())
		c.JSON(http.StatusOK, res.CodeOf(code.TTSFail))
		return
	}

	if len(TTSQueryResponse.TasksInfo) == 0 {
		c.JSON(http.StatusOK, res.CodeOf(code.TTSFail))
		return
	}

	res.Success()
	res.TaskID = TTSQueryResponse.TasksInfo[0].TaskID

	// 任务未完成时 TaskResult 可能为空，先判空避免空指针异常。
	if TTSQueryResponse.TasksInfo[0].TaskResult != nil {
		res.TaskResult = TTSQueryResponse.TasksInfo[0].TaskResult.SpeechURL
	}
	res.TaskStatus = TTSQueryResponse.TasksInfo[0].TaskStatus
	c.JSON(http.StatusOK, res)
}
