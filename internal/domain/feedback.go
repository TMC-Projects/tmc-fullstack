package domain

import (
	"context"
	"time"
)

type Feedback struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Message   string    `json:"message"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type FeedbackRepository interface {
	Create(ctx context.Context, feedback *Feedback) error
}

type FeedbackUsecase interface {
	SubmitFeedback(ctx context.Context, userID uint, message string) (*Feedback, error)
}
