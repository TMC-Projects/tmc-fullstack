package cache

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
	"njara-platform/internal/domain"
)

type redisCache struct {
	client *redis.Client
}

// NewRedisCache creates a new instance of domain.CacheRepository adapter using Redis.
func NewRedisCache(client *redis.Client) domain.CacheRepository {
	return &redisCache{client: client}
}

func (c *redisCache) Set(ctx context.Context, key string, value []byte, ttl time.Duration) error {
	return c.client.Set(ctx, key, value, ttl).Err()
}

func (c *redisCache) Get(ctx context.Context, key string) ([]byte, error) {
	val, err := c.client.Get(ctx, key).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, nil
		}
		return nil, err
	}
	return val, nil
}

func (c *redisCache) Delete(ctx context.Context, key string) error {
	return c.client.Del(ctx, key).Err()
}

func (c *redisCache) DeletePrefix(ctx context.Context, prefix string) error {
	var cursor uint64
	for {
		var keys []string
		var err error
		keys, cursor, err = c.client.Scan(ctx, cursor, prefix+"*", 100).Result()
		if err != nil {
			return err
		}
		if len(keys) > 0 {
			if err := c.client.Del(ctx, keys...).Err(); err != nil {
				return err
			}
		}
		if cursor == 0 {
			break
		}
	}
	return nil
}

func (c *redisCache) SetEx(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return c.client.SetEx(ctx, key, value, ttl).Err()
}

func (c *redisCache) Exists(ctx context.Context, key string) (bool, error) {
	val, err := c.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}

func (c *redisCache) LPush(ctx context.Context, key string, values ...interface{}) error {
	return c.client.LPush(ctx, key, values...).Err()
}

func (c *redisCache) BRPop(ctx context.Context, timeout time.Duration, keys ...string) ([]string, error) {
	return c.client.BRPop(ctx, timeout, keys...).Result()
}
