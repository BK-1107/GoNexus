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

// RAGIndexer ????????????????? Redis ?????
// ?????????????
type RAGIndexer struct {
	embedding embedding.Embedder
	indexer   *redisIndexer.Indexer
}

// RAGQuery ????????? Redis ????????????
// ???????????
type RAGQuery struct {
	embedding embedding.Embedder
	retriever retriever.Retriever
}

// NewRAGEmbedder ?? embedding ??????????????
// API ?????? config.toml??? apiKey ???????????? OPENAI_API_KEY?
func NewRAGEmbedder(ctx context.Context) (embedding.Embedder, error) {
	cfg := config.GetConfig()
	return openai.NewEmbedder(ctx, &openai.EmbeddingConfig{
		BaseURL: cfg.GetEmbeddingBaseURL(),
		APIKey:  cfg.GetEmbeddingAPIKey(),
		Model:   cfg.GetEmbeddingModelID(),
	})
}

// NewRAGIndexer ?? Redis ??????
// indexID ????????? "kb_" + username????????????????
func NewRAGIndexer(indexID string) (*RAGIndexer, error) {
	ctx := context.Background()
	embedder, err := NewRAGEmbedder(ctx)
	if err != nil {
		return nil, err
	}

	// ??? Redis Search ?????dimension ??? embedding ?????????
	dimension := config.GetConfig().GetEmbeddingDimension()
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

// IndexFile ?????????????? chunk ??? Redis ?????
// ??????? .txt ? .md?PDF/docx ????????????????????
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

// extractPlainText ????????
// ?????? PDF/docx ?????????????????
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

// normalizeDocumentID ????????? Redis key ????? ID?
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

// DeleteIndex ?????????? Redis ?????
func DeleteIndex(ctx context.Context, filename string) error {
	if err := redisPkg.DeleteRedisIndex(ctx, filename); err != nil {
		return fmt.Errorf("failed to delete redis index: %w", err)
	}
	return nil
}


