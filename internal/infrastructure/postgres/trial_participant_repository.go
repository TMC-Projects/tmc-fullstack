package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type trialParticipantRepository struct{ db *gorm.DB }

func NewTrialParticipantRepository(db *gorm.DB) domain.TrialParticipantRepository {
	return &trialParticipantRepository{db: db}
}

func (r *trialParticipantRepository) Create(ctx context.Context, p *domain.TrialParticipant) error {
	m := TrialParticipantFromDomain(p)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	p.ID = m.ID
	p.CreatedAt = m.CreatedAt
	p.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialParticipantRepository) Update(ctx context.Context, p *domain.TrialParticipant) error {
	m := TrialParticipantFromDomain(p)
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	p.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialParticipantRepository) GetByID(ctx context.Context, id int64) (*domain.TrialParticipant, error) {
	var m TrialParticipantModel
	err := r.db.WithContext(ctx).Preload("Trial").Preload("Player").First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialParticipantRepository) GetByTrialID(ctx context.Context, trialID int64) ([]*domain.TrialParticipant, error) {
	var models []TrialParticipantModel
	err := r.db.WithContext(ctx).Preload("Player").
		Where("trial_id = ?", trialID).Order("participant_no ASC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	participants := make([]*domain.TrialParticipant, len(models))
	for i := range models {
		participants[i] = models[i].ToDomain()
	}
	return participants, nil
}

func (r *trialParticipantRepository) GetByTrialAndPlayer(ctx context.Context, trialID, playerID int64) (*domain.TrialParticipant, error) {
	var m TrialParticipantModel
	err := r.db.WithContext(ctx).
		Where("trial_id = ? AND player_id = ?", trialID, playerID).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialParticipantRepository) GetByApplicationID(ctx context.Context, applicationID int64) (*domain.TrialParticipant, error) {
	var m TrialParticipantModel
	err := r.db.WithContext(ctx).Where("application_id = ?", applicationID).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialParticipantRepository) CountByTrial(ctx context.Context, trialID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&TrialParticipantModel{}).
		Where("trial_id = ?", trialID).Count(&count).Error
	return count, err
}
