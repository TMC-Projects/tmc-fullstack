package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type recruitmentDecisionRepository struct{ db *gorm.DB }

func NewRecruitmentDecisionRepository(db *gorm.DB) domain.RecruitmentDecisionRepository {
	return &recruitmentDecisionRepository{db: db}
}

func (r *recruitmentDecisionRepository) Create(ctx context.Context, d *domain.RecruitmentDecision) error {
	m := RecruitmentDecisionFromDomain(d)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	d.ID = m.ID
	d.CreatedAt = m.CreatedAt
	d.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *recruitmentDecisionRepository) Update(ctx context.Context, d *domain.RecruitmentDecision) error {
	m := RecruitmentDecisionFromDomain(d)
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	d.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *recruitmentDecisionRepository) GetByParticipantID(ctx context.Context, participantID int64) (*domain.RecruitmentDecision, error) {
	var m RecruitmentDecisionModel
	err := r.db.WithContext(ctx).Preload("Decider").
		Where("participant_id = ?", participantID).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *recruitmentDecisionRepository) GetByTrialID(ctx context.Context, trialID int64) ([]*domain.RecruitmentDecision, error) {
	var models []RecruitmentDecisionModel
	err := r.db.WithContext(ctx).Preload("Participant").Preload("Participant.Player").Preload("Decider").
		Where("trial_id = ?", trialID).Order("created_at DESC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	decisions := make([]*domain.RecruitmentDecision, len(models))
	for i := range models {
		decisions[i] = models[i].ToDomain()
	}
	return decisions, nil
}
