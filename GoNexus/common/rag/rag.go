package rag

import (
	"GoNexus/common/redis"
	redisPkg "GoNexus/common/redis"
	"GoNexus/config"
	"context"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/cloudwego/eino-ext/components/embedding/openai"
	redisIndexer "github.com/cloudwego/eino-ext/components/indexer/redis"
	redisRetriever "github.com/cloudwego/eino-ext/components/retriever/redis"
	"github.com/cloudwego/eino/components/embedding"
	"github.com/cloudwego/eino/components/retriever"
	"github.com/cloudwego/eino/schema"
	redisCli "github.com/redis/go-redis/v9"
)

// UserKnowledgeIndexID returns the shared Redis index ID for one user's knowledge base.
func UserKnowledgeIndexID(username string) string {
	return "kb_" + username
}

// RAGIndexer 负责把上传的文档转换成向量，并写入 Redis 向量索引。
// 它主要在文件上传阶段使用。
type RAGIndexer struct {
	embedding embedding.Embedder
	indexer   *redisIndexer.Indexer
}

// RAGQuery 负责根据用户问题从 Redis 向量索引里检索相关文档。
// 它主要在聊天阶段使用。
type RAGQuery struct {
	embedding embedding.Embedder
	retriever retriever.Retriever
}

// NewRAGEmbedder 创建 embedding 模型，用于把文本转换成向量。
// API 配置优先来自 config.toml，如果 apiKey 为空，则尝试读取环境变量 OPENAI_API_KEY。
func NewRAGEmbedder(ctx context.Context) (embedding.Embedder, error) {
	cfg := config.GetConfig()
	return openai.NewEmbedder(ctx, &openai.EmbeddingConfig{
		BaseURL: cfg.GetLLMBaseURL(),
		APIKey:  cfg.GetLLMAPIKey(),
		Model:   cfg.RagModelConfig.RagEmbeddingModel,
	})
}

// NewRAGIndexer 创建 Redis 向量索引器。
// indexID 在当前项目中通常是 "kb_" + username，用来区分不同用户的知识库索引。
func NewRAGIndexer(indexID string) (*RAGIndexer, error) {
	ctx := context.Background()
	embedder, err := NewRAGEmbedder(ctx)
	if err != nil {
		return nil, err
	}

	// 初始化 Redis Search 向量索引，dimension 必须和 embedding 模型输出维度一致。
	dimension := config.GetConfig().RagModelConfig.RagDimension
	if err := redisPkg.InitRedisIndex(ctx, indexID, dimension); err != nil {
		return nil, fmt.Errorf("failed to init redis index: %w", err)
	}

	rdb := redisPkg.Rdb
	indexerConfig := &redisIndexer.IndexerConfig{
		Client:    rdb,
		KeyPrefix: redis.GenerateIndexNamePrefix(indexID),
		BatchSize: 10,
		DocumentToHashes: func(ctx context.Context, doc *schema.Document) (*redisIndexer.Hashes, error) {
			source := ""
			if s, ok := doc.MetaData["source"].(string); ok {
				source = s
			}
			return &redisIndexer.Hashes{
				Key: fmt.Sprintf("%s:%s", indexID, doc.ID),
				Field2Value: map[string]redisIndexer.FieldValue{
					"content":  {Value: doc.Content, EmbedKey: "vector"},
					"metadata": {Value: source},
				},
			}, nil
		},
	}
	indexerConfig.Embedding = embedder

	idx, err := redisIndexer.NewIndexer(ctx, indexerConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create indexer: %w", err)
	}

	return &RAGIndexer{
		embedding: embedder,
		indexer:   idx,
	}, nil
}

// IndexFile 读取上传文件内容，切分成多个 chunk 后写入 Redis 向量索引。
// 当前暂时只索引 .txt 和 .md；PDF/docx 需要额外文本提取依赖，后续可以单独扩展。
func (r *RAGIndexer) IndexFile(ctx context.Context, filePath string) error {
	content, err := extractPlainText(filePath)
	if err != nil {
		return err
	}

	chunks := splitText(content, defaultChunkSize, defaultChunkOverlap)
	if len(chunks) == 0 {
		return fmt.Errorf("file has no indexable content: %s", filePath)
	}

	fileID := normalizeDocumentID(filepath.Base(filePath))
	docs := make([]*schema.Document, 0, len(chunks))
	for i, chunk := range chunks {
		docs = append(docs, &schema.Document{
			ID:      fmt.Sprintf("%s_chunk_%d", fileID, i),
			Content: chunk,
			MetaData: map[string]any{
				"source": filePath,
				"chunk":  i,
			},
		})
	}

	_, err = r.indexer.Store(ctx, docs)
	if err != nil {
		return fmt.Errorf("failed to store document chunks: %w", err)
	}

	return nil
}

// extractPlainText 提取可索引文本。
// 为了避免引入 PDF/docx 解析依赖，当前只支持纯文本类文件。
func extractPlainText(filePath string) (string, error) {
	ext := strings.ToLower(filepath.Ext(filePath))
	switch ext {
	case ".txt", ".md":
	default:
		return "", fmt.Errorf("rag indexing currently supports only .txt and .md files, got %s", ext)
	}

	content, err := os.ReadFile(filePath)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	text := strings.TrimSpace(string(content))
	if text == "" {
		return "", fmt.Errorf("file is empty: %s", filePath)
	}
	return text, nil
}

// normalizeDocumentID 将文件名转换成适合 Redis key 的稳定文档 ID。
func normalizeDocumentID(name string) string {
	name = strings.TrimSpace(name)
	name = strings.ReplaceAll(name, ".", "_")
	name = strings.ReplaceAll(name, "-", "_")
	name = strings.ReplaceAll(name, " ", "_")
	if name == "" {
		return "document"
	}
	return name
}

// DeleteIndex 删除指定知识库对应的 Redis 向量索引。
func DeleteIndex(ctx context.Context, filename string) error {
	if err := redisPkg.DeleteRedisIndex(ctx, filename); err != nil {
		return fmt.Errorf("failed to delete redis index: %w", err)
	}
	return nil
}

// NewRAGQuery 创建检索器，用于在聊天时从当前用户的知识库中检索相关文档。
func NewRAGQuery(ctx context.Context, username string) (*RAGQuery, error) {
	embedder, err := NewRAGEmbedder(ctx)
	if err != nil {
		return nil, err
	}

	// 每个用户对应一个知识库索引，和上传阶段的 indexID 保持一致。
	indexID := UserKnowledgeIndexID(username)
	indexName := redis.GenerateIndexName(indexID)
	rdb := redisPkg.Rdb

	retrieverConfig := &redisRetriever.RetrieverConfig{
		Client:       rdb,
		Index:        indexName,
		Dialect:      2,
		ReturnFields: []string{"content", "metadata", "distance"},
		TopK:         5,
		VectorField:  "vector",
		DocumentConverter: func(ctx context.Context, doc redisCli.Document) (*schema.Document, error) {
			resp := &schema.Document{
				ID:       doc.ID,
				Content:  "",
				MetaData: map[string]any{},
			}
			for field, val := range doc.Fields {
				if field == "content" {
					resp.Content = val
				} else {
					resp.MetaData[field] = val
				}
			}
			return resp, nil
		},
	}
	retrieverConfig.Embedding = embedder

	rtr, err := redisRetriever.NewRetriever(ctx, retrieverConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create retriever: %w", err)
	}

	return &RAGQuery{
		embedding: embedder,
		retriever: rtr,
	}, nil
}

// RetrieveDocuments 根据用户问题检索最相关的文档片段。
func (r *RAGQuery) RetrieveDocuments(ctx context.Context, query string) ([]*schema.Document, error) {
	return r.retriever.Retrieve(ctx, query)
}

// BuildRAGPrompt 把检索到的参考文档和用户问题组合成最终 prompt。
// 如果没有检索到文档，就直接返回原始问题，让模型按普通聊天处理。
func BuildRAGPrompt(query string, docs []*schema.Document) string {
	if len(docs) == 0 {
		return query
	}

	contextText := ""
	for i, doc := range docs {
		contextText += fmt.Sprintf("[文档 %d]: %s\n\n", i+1, doc.Content)
	}

	prompt := fmt.Sprintf(`你是一个专业的 AI 助手。请根据以下提供的【参考文档】内容，结合你的通用知识，尽可能准确地回答用户的问题。

【参考文档】：
%s

【用户问题】：
%s

要求：
1. 如果参考文档中包含相关信息，请优先使用文档内容进行回答。
2. 如果文档信息不够完整，可以结合你的通用知识进行合理推断和补充。
3. 即使参考信息非常简短，也请尝试将其与用户问题关联并给出评价或建议。

请直接输出回答内容：`, contextText, query)

	return prompt
}
