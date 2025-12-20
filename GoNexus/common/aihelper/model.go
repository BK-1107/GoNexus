package aihelper

import (
	"context"

	"github.com/cloudwego/eino/schema"
)

type StreamCallback func(msg string)

// AIModel defines the common contract implemented by every chat provider.
type AIModel interface {
	GenerateResponse(ctx context.Context, messages []*schema.Message) (*schema.Message, error)
	StreamResponse(ctx context.Context, messages []*schema.Message, cb StreamCallback) (string, error)
	GetModelType() string
}
