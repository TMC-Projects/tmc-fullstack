package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type clubRepository struct {
	db *gorm.DB
}

// NewClubRepository creates a new instance of domain.ClubRepository adapter using GORM.
func NewClubRepository(db *gorm.DB) domain.ClubRepository {
	return &clubRepository{db: db}
}

func (r *clubRepository) Create(ctx context.Context, club *domain.Club) error {
	m := ClubFromDomain(club)
	err := r.db.WithContext(ctx).Create(m).Error
	if err != nil {
		return err
	}
	club.ID = m.ID
	club.CreatedAt = m.CreatedAt
	club.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *clubRepository) GetByName(ctx context.Context, name string) (*domain.Club, error) {
	var m ClubModel
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *clubRepository) GetByID(ctx context.Context, id int64) (*domain.Club, error) {
	var m ClubModel
	err := r.db.WithContext(ctx).Preload("Achievements").First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *clubRepository) Update(ctx context.Context, club *domain.Club) error {
	m := ClubFromDomain(club)
	err := r.db.WithContext(ctx).Save(m).Error
	if err != nil {
		return err
	}
	club.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *clubRepository) GetAll(ctx context.Context) ([]*domain.Club, error) {
	var models []ClubModel
	err := r.db.WithContext(ctx).Find(&models).Error
	if err != nil {
		return nil, err
	}

	clubs := make([]*domain.Club, len(models))
	for i, m := range models {
		clubs[i] = m.ToDomain()
	}
	return clubs, nil
}

// ─── Achievements ────────────────────────────────────────────────────────────

func (r *clubRepository) CreateAchievement(ctx context.Context, ach *domain.ClubAchievement) error {
	m := ClubAchievementFromDomain(ach)
	err := r.db.WithContext(ctx).Create(m).Error
	if err != nil {
		return err
	}
	ach.ID = m.ID
	ach.CreatedAt = m.CreatedAt
	ach.UpdatedAt = m.UpdatedAt
	return nil
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

func (r *clubRepository) CreateOnboarding(ctx context.Context, onboarding *domain.ClubOnboarding) error {
	return r.db.WithContext(ctx).Create(onboarding).Error
}

func (r *clubRepository) GetLatestOnboardingByClubID(ctx context.Context, clubID int64) (*domain.ClubOnboarding, error) {
	var onboarding domain.ClubOnboarding
	if err := r.db.WithContext(ctx).Where("club_id = ?", clubID).Order("created_at desc").First(&onboarding).Error; err != nil {
		return nil, err
	}
	return &onboarding, nil
}

func (r *clubRepository) GetOnboardingByID(ctx context.Context, id int64) (*domain.ClubOnboarding, error) {
	var onboarding domain.ClubOnboarding
	if err := r.db.WithContext(ctx).First(&onboarding, id).Error; err != nil {
		return nil, err
	}
	return &onboarding, nil
}

func (r *clubRepository) UpdateOnboarding(ctx context.Context, onboarding *domain.ClubOnboarding) error {
	return r.db.WithContext(ctx).Save(onboarding).Error
}

func (r *clubRepository) UpdateAchievement(ctx context.Context, ach *domain.ClubAchievement) error {
	m := ClubAchievementFromDomain(ach)
	err := r.db.WithContext(ctx).Save(m).Error
	if err != nil {
		return err
	}
	ach.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *clubRepository) DeleteAchievement(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&ClubAchievementModel{}, id).Error
}

func (r *clubRepository) GetAchievementByID(ctx context.Context, id int64) (*domain.ClubAchievement, error) {
	var m ClubAchievementModel
	err := r.db.WithContext(ctx).First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}
