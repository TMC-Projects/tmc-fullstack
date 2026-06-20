package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type trialApplicationRepository struct{ db *gorm.DB }

func NewTrialApplicationRepository(db *gorm.DB) domain.TrialApplicationRepository {
	return &trialApplicationRepository{db: db}
}

func (r *trialApplicationRepository) Create(ctx context.Context, app *domain.TrialApplication) error {
	m := TrialApplicationFromDomain(app)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	app.ID = m.ID
	app.CreatedAt = m.CreatedAt
	app.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialApplicationRepository) Update(ctx context.Context, app *domain.TrialApplication) error {
	m := TrialApplicationFromDomain(app)
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	app.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialApplicationRepository) GetByID(ctx context.Context, id int64) (*domain.TrialApplication, error) {
	var m TrialApplicationModel
	err := r.db.WithContext(ctx).Preload("Trial").Preload("Player").First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialApplicationRepository) GetByTrialAndPlayer(ctx context.Context, trialID, playerID int64) (*domain.TrialApplication, error) {
	var m TrialApplicationModel
	err := r.db.WithContext(ctx).
		Where("trial_id = ? AND player_id = ?", trialID, playerID).
		First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialApplicationRepository) GetByTrialID(ctx context.Context, trialID int64) ([]*domain.TrialApplication, error) {
	var models []TrialApplicationModel
	err := r.db.WithContext(ctx).
		Preload("Player").
		Preload("Player.Stats").
		Preload("Player.Achievements").
		Preload("Player.Highlights").
		Preload("Player.SocialMedias").
		Where("trial_id = ?", trialID).Order("applied_at ASC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	apps := make([]*domain.TrialApplication, len(models))
	for i := range models {
		apps[i] = models[i].ToDomain()
	}
	return apps, nil
}

func (r *trialApplicationRepository) GetByPlayerID(ctx context.Context, playerID int64) ([]*domain.TrialApplication, error) {
	var models []TrialApplicationModel
	err := r.db.WithContext(ctx).Preload("Trial").Preload("Trial.Club").Preload("Trial.Game").
		Where("player_id = ?", playerID).Order("applied_at DESC").Find(&models).Error
	if err != nil {
		return nil, err
	}
	apps := make([]*domain.TrialApplication, len(models))
	for i := range models {
		apps[i] = models[i].ToDomain()
	}
	return apps, nil
}

func (r *trialApplicationRepository) CountByTrialAndStatus(ctx context.Context, trialID int64, status string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&TrialApplicationModel{}).
		Where("trial_id = ? AND status = ?", trialID, status).Count(&count).Error
	return count, err
}
