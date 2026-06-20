package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type trialRepository struct{ db *gorm.DB }

func NewTrialRepository(db *gorm.DB) domain.TrialRepository {
	return &trialRepository{db: db}
}

func (r *trialRepository) Create(ctx context.Context, trial *domain.Trial) error {
	m := TrialFromDomain(trial)
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	trial.ID = m.ID
	trial.CreatedAt = m.CreatedAt
	trial.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialRepository) Update(ctx context.Context, trial *domain.Trial) error {
	m := TrialFromDomain(trial)
	if err := r.db.WithContext(ctx).Save(m).Error; err != nil {
		return err
	}
	trial.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *trialRepository) GetByID(ctx context.Context, id int64) (*domain.Trial, error) {
	var m TrialModel
	err := r.db.WithContext(ctx).Preload("Club").Preload("Game").First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *trialRepository) GetList(ctx context.Context, filter domain.TrialFilter) ([]*domain.Trial, int64, error) {
	q := r.db.WithContext(ctx).Model(&TrialModel{})
	if filter.Status != "" {
		q = q.Where("status = ?", filter.Status)
	}
	if filter.ClubID != 0 {
		q = q.Where("club_id = ?", filter.ClubID)
	}
	if filter.GameID != 0 {
		q = q.Where("game_id = ?", filter.GameID)
	}

	var total int64
	if err := q.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 {
		limit = 20
	}

	var models []TrialModel
	err := q.Preload("Club").Preload("Game").
		Order("start_date ASC").
		Offset((page - 1) * limit).Limit(limit).
		Find(&models).Error
	if err != nil {
		return nil, 0, err
	}

	trials := make([]*domain.Trial, len(models))
	for i := range models {
		trials[i] = models[i].ToDomain()
	}
	return trials, total, nil
}
