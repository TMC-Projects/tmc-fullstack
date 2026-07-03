package postgres

import (
	"njara-platform/internal/domain"
	"time"

	"gorm.io/gorm"
)

type FeedbackModel struct {
	ID        uint           `gorm:"primaryKey;autoIncrement"`
	UserID    uint           `gorm:"not null;index"`
	Message   string         `gorm:"type:text;not null"`
	CreatedAt time.Time      `gorm:"autoCreateTime"`
	UpdatedAt time.Time      `gorm:"autoUpdateTime"`
	DeletedAt gorm.DeletedAt `gorm:"index"`

	// Relationship
	User UserModel `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (FeedbackModel) TableName() string {
	return "feedbacks"
}

func (m *FeedbackModel) ToDomain() *domain.Feedback {
	return &domain.Feedback{
		ID:        m.ID,
		UserID:    m.UserID,
		Message:   m.Message,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func FromDomainFeedback(f *domain.Feedback) *FeedbackModel {
	return &FeedbackModel{
		ID:      f.ID,
		UserID:  f.UserID,
		Message: f.Message,
	}
}
