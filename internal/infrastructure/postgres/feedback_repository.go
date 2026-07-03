package postgres

import (
	"context"
	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type feedbackRepository struct {
	db *gorm.DB
}

func NewFeedbackRepository(db *gorm.DB) domain.FeedbackRepository {
	return &feedbackRepository{db: db}
}

func (r *feedbackRepository) Create(ctx context.Context, feedback *domain.Feedback) error {
	model := FromDomainFeedback(feedback)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	feedback.ID = model.ID
	feedback.CreatedAt = model.CreatedAt
	feedback.UpdatedAt = model.UpdatedAt
	return nil
}
