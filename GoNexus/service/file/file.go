package file

import (
	"GopherAI/common/rag"
	"GopherAI/config"
	"GopherAI/utils"
	"context"
	"io"
	"log"
	"mime/multipart"
	"os"
	"path/filepath"
)

// 上传rag相关文件（这里只允许文本文件）
// 其实可以直接将其向量化进行保存，但这边依旧存储到服务器上以便后续可以在服务器上查看历史RAG文件
func UploadRagFile(username string, file *multipart.FileHeader) (string, error) {
	// 校验文件类型和文件名
	if err := utils.ValidateFile(file); err != nil {
		log.Printf("File validation failed: %v", err)
		return "", err
	}

	// 创建用户目录
	userDir := filepath.Join("uploads", username)
	if err := os.MkdirAll(userDir, 0755); err != nil {
		log.Printf("Failed to create user directory %s: %v", userDir, err)
		return "", err
	}

	// [优化] 不再删除旧文件，支持多文档 RAG
	// 使用统一的 IndexID: "kb_" + username
	indexID := "kb_" + username

	// 生成UUID作为唯一文件名
	uuid := utils.GenerateUUID()

	ext := filepath.Ext(file.Filename)
	filename := uuid + ext
	filePath := filepath.Join(userDir, filename)

	// 打开上传的文件
	src, err := file.Open()
	if err != nil {
		log.Printf("Failed to open uploaded file: %v", err)
		return "", err
	}
	defer src.Close()

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		log.Printf("Failed to create destination file %s: %v", filePath, err)
		return "", err
	}
	defer dst.Close()

	if _, err := io.Copy(dst, src); err != nil {
		log.Printf("Failed to copy file content: %v", err)
		return "", err
	}

	log.Printf("File uploaded successfully: %s", filePath)

	// 如果是图片文件，跳过索引步骤，仅完成上传
	isImage := map[string]bool{
		".jpg":  true,
		".jpeg": true,
		".png":  true,
		".webp": true,
	}[ext]

	if isImage {
		log.Printf("Image uploaded without indexing: %s", filePath)
		return filePath, nil
	}

	// 创建 RAG 索引器并对文件进行向量化
	indexer, err := rag.NewRAGIndexer(indexID, config.GetConfig().RagModelConfig.RagEmbeddingModel)
	if err != nil {
		log.Printf("Failed to create RAG indexer: %v", err)
		// 删除已上传的文件
		os.Remove(filePath)
		return "", err
	}

	// 读取文件内容并创建向量索引
	if err := indexer.IndexFile(context.Background(), filePath); err != nil {
		log.Printf("Failed to index file: %v", err)
		// 删除已上传的文件
		os.Remove(filePath)
		// 注意：多文件模式下不建议直接删除整个 indexID，除非这是第一个文件
		return "", err
	}

	log.Printf("File indexed successfully: %s to %s", filename, indexID)
	return filePath, nil
}

func DeleteKnowledgeFile(username, filename string) error {
	filePath := filepath.Join("uploads", username, filename)
	
	// 删除物理文件
	if err := os.Remove(filePath); err != nil {
		if !os.IsNotExist(err) {
			return err
		}
	}

	log.Printf("Knowledge file deleted: %s/%s", username, filename)
	return nil
}
