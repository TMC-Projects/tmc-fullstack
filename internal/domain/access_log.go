package domain

import (
	"context"
	"time"
)

// AccessLog represents a single HTTP request log.
type AccessLog struct {
	ID        int64     `json:"id"`
	RequestID string    `json:"request_id"`
	Method    string    `json:"method"`
	Path      string    `json:"path"`
	IP        string    `json:"ip"`
	Status    int       `json:"status"`
	Latency   int64     `json:"latency"` // in milliseconds
	UserAgent string    `json:"user_agent"`
	UserID    *int64    `json:"user_id"`
	Email     string    `json:"email"`
	UserRole  string    `json:"user_role"`
	CreatedAt time.Time `json:"created_at"`
}

// AccessLogFilter defines the query parameters for filtering access logs.
type AccessLogFilter struct {
	Page  int
	Limit int
}

// PaginatedAccessLogs holds a paginated list of access logs.
type PaginatedAccessLogs struct {
	Data       []*AccessLog `json:"data"`
	Total      int64        `json:"total"`
	Page       int          `json:"page"`
	Limit      int          `json:"limit"`
	TotalPages int          `json:"total_pages"`
}

// AccessLogRepository defines the outbound port for database operations.
type AccessLogRepository interface {
	Create(ctx context.Context, log *AccessLog) error
	GetList(ctx context.Context, filter AccessLogFilter) ([]*AccessLog, int64, error)
}

// AccessLogUsecase defines the inbound port for business logic.
type AccessLogUsecase interface {
	GetList(ctx context.Context, filter AccessLogFilter) (*PaginatedAccessLogs, error)
}
