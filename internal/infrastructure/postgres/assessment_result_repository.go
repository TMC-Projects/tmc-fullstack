package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type assessmentResultRepository struct{ db *gorm.DB }

func NewAssessmentResultRepository(db *gorm.DB) domain.AssessmentResultRepository {
	return &assessmentResultRepository{db: db}
}

func (r *assessmentResultRepository) Create(ctx context.Context, res *domain.AssessmentResult) error {
	m := AssessmentResultFromDomain(res)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	res.ID = m.ID
	res.CreatedAt = m.CreatedAt
	res.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *assessmentResultRepository) Update(ctx context.Context, res *domain.AssessmentResult) error {
	m := AssessmentResultFromDomain(res)
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	res.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *assessmentResultRepository) GetByID(ctx context.Context, id int64) (*domain.AssessmentResult, error) {
	var m AssessmentResultModel
	err := r.db.WithContext(ctx).
		Preload("Participant").Preload("Participant.Player").Preload("Assessor").
		First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *assessmentResultRepository) GetByParticipantID(ctx context.Context, participantID int64) ([]*domain.AssessmentResult, error) {
	var models []AssessmentResultModel
	err := r.db.WithContext(ctx).Preload("Assessor").
		Where("participant_id = ?", participantID).
		Order("created_at DESC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	results := make([]*domain.AssessmentResult, len(models))
	for i := range models {
		results[i] = models[i].ToDomain()
	}
	return results, nil
}
