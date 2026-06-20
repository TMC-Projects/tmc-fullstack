package domain

import (
	"context"
	"time"
)

// CacheRepository defines the outbound port for cache operations (Cache-Aside pattern).
type CacheRepository interface {
	Set(ctx context.Context, key string, value []byte, ttl time.Duration) error
	Get(ctx context.Context, key string) ([]byte, error)
	Delete(ctx context.Context, key string) error
	DeletePrefix(ctx context.Context, prefix string) error
	
	// String / Key ops
	SetEx(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Exists(ctx context.Context, key string) (bool, error)

	// List ops
	LPush(ctx context.Context, key string, values ...interface{}) error
	BRPop(ctx context.Context, timeout time.Duration, keys ...string) ([]string, error)
}
