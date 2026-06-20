package postgres

import (
	"context"
	"errors"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type subscriptionPlanRepository struct {
	db *gorm.DB
}

// NewSubscriptionPlanRepository creates a new PostgreSQL-backed SubscriptionPlanRepository.
func NewSubscriptionPlanRepository(db *gorm.DB) domain.SubscriptionPlanRepository {
	return &subscriptionPlanRepository{db: db}
}

func (r *subscriptionPlanRepository) GetAll(ctx context.Context) ([]*domain.SubscriptionPlan, error) {
	var models []SubscriptionPlanModel
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("duration_months asc").Find(&models).Error; err != nil {
		return nil, err
	}
	plans := make([]*domain.SubscriptionPlan, len(models))
	for i, m := range models {
		plans[i] = m.ToDomain()
	}
	return plans, nil
}

func (r *subscriptionPlanRepository) GetByID(ctx context.Context, id int64) (*domain.SubscriptionPlan, error) {
	var model SubscriptionPlanModel
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *subscriptionPlanRepository) Create(ctx context.Context, plan *domain.SubscriptionPlan) error {
	model := SubscriptionPlanFromDomain(plan)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	plan.ID = model.ID
	plan.CreatedAt = model.CreatedAt
	plan.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *subscriptionPlanRepository) Update(ctx context.Context, plan *domain.SubscriptionPlan) error {
	model := SubscriptionPlanFromDomain(plan)
	return r.db.WithContext(ctx).Save(model).Error
}

// ---

type subscriptionRepository struct {
	db *gorm.DB
}

// NewSubscriptionRepository creates a new PostgreSQL-backed SubscriptionRepository.
func NewSubscriptionRepository(db *gorm.DB) domain.SubscriptionRepository {
	return &subscriptionRepository{db: db}
}

func (r *subscriptionRepository) Create(ctx context.Context, sub *domain.Subscription) error {
	model := SubscriptionFromDomain(sub)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	sub.ID = model.ID
	sub.CreatedAt = model.CreatedAt
	sub.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *subscriptionRepository) GetByID(ctx context.Context, id int64) (*domain.Subscription, error) {
	var model SubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Club").Preload("Plan").First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *subscriptionRepository) GetByOrderID(ctx context.Context, orderID string) (*domain.Subscription, error) {
	var model SubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Club").Preload("Plan").Where("payment_order_id = ?", orderID).First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *subscriptionRepository) GetByClubID(ctx context.Context, clubID int64) ([]*domain.Subscription, error) {
	var models []SubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Plan").Where("club_id = ?", clubID).Order("created_at desc").Find(&models).Error; err != nil {
		return nil, err
	}
	subs := make([]*domain.Subscription, len(models))
	for i, m := range models {
		subs[i] = m.ToDomain()
	}
	return subs, nil
}

func (r *subscriptionRepository) Update(ctx context.Context, sub *domain.Subscription) error {
	model := SubscriptionFromDomain(sub)
	return r.db.WithContext(ctx).Save(model).Error
}
