package rag

import (
	"GoNexus/config"
	"context"

	"github.com/cloudwego/eino-ext/components/embedding/openai"
	"github.com/cloudwego/eino/components/embedding"
)

// NewRAGEmbedder creates the embedding provider used by knowledge documents.
func NewRAGEmbedder(ctx context.Context) (embedding.Embedder, error) {
	cfg := config.GetConfig()
	return openai.NewEmbedder(ctx, &openai.EmbeddingConfig{
		BaseURL: cfg.GetEmbeddingBaseURL(),
		APIKey:  cfg.GetEmbeddingAPIKey(),
		Model:   cfg.GetEmbeddingModelID(),
	})
}
