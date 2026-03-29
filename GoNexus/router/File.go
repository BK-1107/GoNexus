package router

import (
	"GoNexus/controller/file"

	"github.com/gin-gonic/gin"
)

func FileRouter(r *gin.RouterGroup) {
	r.POST("/upload", file.UploadRagFile)
	r.DELETE("/knowledge", file.DeleteKnowledgeFile)
}
