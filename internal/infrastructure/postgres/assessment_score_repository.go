package postgres

import (
	"context"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type assessmentScoreRepository struct{ db *gorm.DB }

func NewAssessmentScoreRepository(db *gorm.DB) domain.AssessmentScoreRepository {
	return &assessmentScoreRepository{db: db}
}

func (r *assessmentScoreRepository) BulkCreate(ctx context.Context, scores []*domain.AssessmentScore) error {
	if len(scores) == 0 {
		return nil
	}
	models := make([]AssessmentScoreModel, len(scores))
	for i, s := range scores {
		models[i] = *AssessmentScoreFromDomain(s)
	}
	if err := r.db.WithContext(ctx).Create(&models).Error; err != nil {
		return err
	}
	// Write back generated IDs and timestamps
	for i := range scores {
		scores[i].ID = models[i].ID
		scores[i].CreatedAt = models[i].CreatedAt
		scores[i].UpdatedAt = models[i].UpdatedAt
	}
	return nil
}

func (r *assessmentScoreRepository) GetByAssessmentID(ctx context.Context, assessmentID int64) ([]*domain.AssessmentScore, error) {
	var models []AssessmentScoreModel
	err := r.db.WithContext(ctx).Preload("Criteria").
		Where("assessment_result_id = ?", assessmentID).
		Order("criteria_id ASC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	scores := make([]*domain.AssessmentScore, len(models))
	for i := range models {
		scores[i] = models[i].ToDomain()
	}
	return scores, nil
}
