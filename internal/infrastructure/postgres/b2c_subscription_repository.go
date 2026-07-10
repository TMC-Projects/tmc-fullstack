package postgres

import (
	"context"
	"errors"
	"time"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type b2cSubscriptionRepository struct {
	db *gorm.DB
}

// NewB2CSubscriptionRepository creates a new PostgreSQL-backed B2CSubscriptionRepository.
func NewB2CSubscriptionRepository(db *gorm.DB) domain.B2CSubscriptionRepository {
	return &b2cSubscriptionRepository{db: db}
}

// Plans
func (r *b2cSubscriptionRepository) GetAllPlans(ctx context.Context) ([]*domain.B2CSubscriptionPlan, error) {
	var models []B2CSubscriptionPlanModel
	if err := r.db.WithContext(ctx).Where("is_active = ?", true).Order("duration_months asc").Find(&models).Error; err != nil {
		return nil, err
	}
	plans := make([]*domain.B2CSubscriptionPlan, len(models))
	for i, m := range models {
		plans[i] = m.ToDomain()
	}
	return plans, nil
}

func (r *b2cSubscriptionRepository) GetPlanByID(ctx context.Context, id int64) (*domain.B2CSubscriptionPlan, error) {
	var model B2CSubscriptionPlanModel
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *b2cSubscriptionRepository) CreatePlan(ctx context.Context, plan *domain.B2CSubscriptionPlan) error {
	model := B2CSubscriptionPlanFromDomain(plan)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*plan = *model.ToDomain()
	return nil
}

// Subscriptions
func (r *b2cSubscriptionRepository) CreateSubscription(ctx context.Context, sub *domain.B2CSubscription) error {
	model := B2CSubscriptionFromDomain(sub)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*sub = *model.ToDomain()
	return nil
}

func (r *b2cSubscriptionRepository) GetSubscriptionByID(ctx context.Context, id int64) (*domain.B2CSubscription, error) {
	var model B2CSubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Plan").First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *b2cSubscriptionRepository) GetSubscriptionByOrderID(ctx context.Context, orderID string) (*domain.B2CSubscription, error) {
	var model B2CSubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Plan").Where("payment_order_id = ?", orderID).First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *b2cSubscriptionRepository) GetActiveSubscriptionByUserID(ctx context.Context, userID int64) (*domain.B2CSubscription, error) {
	var model B2CSubscriptionModel
	now := time.Now()
	// Find paid subscription that hasn't expired
	if err := r.db.WithContext(ctx).Preload("Plan").
		Where("user_id = ? AND status = ? AND expired_at > ?", userID, "paid", now).
		Order("expired_at desc").
		First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *b2cSubscriptionRepository) GetSubscriptionsByUserID(ctx context.Context, userID int64) ([]*domain.B2CSubscription, error) {
	var models []B2CSubscriptionModel
	if err := r.db.WithContext(ctx).Preload("Plan").Where("user_id = ?", userID).Order("created_at desc").Find(&models).Error; err != nil {
		return nil, err
	}
	subs := make([]*domain.B2CSubscription, len(models))
	for i, m := range models {
		subs[i] = m.ToDomain()
	}
	return subs, nil
}

func (r *b2cSubscriptionRepository) UpdateSubscription(ctx context.Context, sub *domain.B2CSubscription) error {
	model := B2CSubscriptionFromDomain(sub)
	return r.db.WithContext(ctx).Save(model).Error
}

func (r *b2cSubscriptionRepository) IsUserPremium(ctx context.Context, userID int64) (bool, error) {
	sub, err := r.GetActiveSubscriptionByUserID(ctx, userID)
	if err != nil {
		return false, err
	}
	return sub != nil, nil
}
