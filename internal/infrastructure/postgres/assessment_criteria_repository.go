package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type assessmentCriteriaRepository struct{ db *gorm.DB }

func NewAssessmentCriteriaRepository(db *gorm.DB) domain.AssessmentCriteriaRepository {
	return &assessmentCriteriaRepository{db: db}
}

func (r *assessmentCriteriaRepository) Create(ctx context.Context, c *domain.AssessmentCriteria) error {
	m := AssessmentCriteriaFromDomain(c)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	c.ID = m.ID
	c.CreatedAt = m.CreatedAt
	c.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *assessmentCriteriaRepository) GetAll(ctx context.Context) ([]*domain.AssessmentCriteria, error) {
	var models []AssessmentCriteriaModel
	if err := r.db.WithContext(ctx).Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.AssessmentCriteria, len(models))
	for i := range models {
		result[i] = models[i].ToDomain()
	}
	return result, nil
}

func (r *assessmentCriteriaRepository) GetActive(ctx context.Context) ([]*domain.AssessmentCriteria, error) {
	var models []AssessmentCriteriaModel
	if err := r.db.WithContext(ctx).Where("is_active = true").Find(&models).Error; err != nil {
		return nil, err
	}
	result := make([]*domain.AssessmentCriteria, len(models))
	for i := range models {
		result[i] = models[i].ToDomain()
	}
	return result, nil
}

func (r *assessmentCriteriaRepository) GetByID(ctx context.Context, id int64) (*domain.AssessmentCriteria, error) {
	var m AssessmentCriteriaModel
	err := r.db.WithContext(ctx).First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *assessmentCriteriaRepository) GetByName(ctx context.Context, name string) (*domain.AssessmentCriteria, error) {
	var m AssessmentCriteriaModel
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}
