package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// B2CSubscriptionPlanModel represents the GORM schema for b2c_subscription_plans table.
type B2CSubscriptionPlanModel struct {
	ID             int64     `gorm:"primaryKey;autoIncrement"`
	Name           string    `gorm:"uniqueIndex;not null;type:varchar(100)"`
	DurationMonths int       `gorm:"not null"`
	Price          int64     `gorm:"not null"` // Price in IDR
	Description    string    `gorm:"type:text"`
	IsActive       bool      `gorm:"not null;default:true"`
	CreatedAt      time.Time `gorm:"not null"`
	UpdatedAt      time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (B2CSubscriptionPlanModel) TableName() string {
	return "b2c_subscription_plans"
}

// ToDomain maps B2CSubscriptionPlanModel to domain.B2CSubscriptionPlan.
func (m *B2CSubscriptionPlanModel) ToDomain() *domain.B2CSubscriptionPlan {
	if m == nil {
		return nil
	}
	return &domain.B2CSubscriptionPlan{
		ID:             m.ID,
		Name:           m.Name,
		DurationMonths: m.DurationMonths,
		Price:          m.Price,
		Description:    m.Description,
		IsActive:       m.IsActive,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

// B2CSubscriptionPlanFromDomain maps domain.B2CSubscriptionPlan to B2CSubscriptionPlanModel.
func B2CSubscriptionPlanFromDomain(d *domain.B2CSubscriptionPlan) *B2CSubscriptionPlanModel {
	if d == nil {
		return nil
	}
	return &B2CSubscriptionPlanModel{
		ID:             d.ID,
		Name:           d.Name,
		DurationMonths: d.DurationMonths,
		Price:          d.Price,
		Description:    d.Description,
		IsActive:       d.IsActive,
		CreatedAt:      d.CreatedAt,
		UpdatedAt:      d.UpdatedAt,
	}
}

// B2CSubscriptionModel represents the GORM schema for b2c_player_subscriptions table.
type B2CSubscriptionModel struct {
	ID              int64                    `gorm:"primaryKey;autoIncrement"`
	UserID          int64                    `gorm:"not null;index"`
	User            UserModel                `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	PlanID          int64                    `gorm:"not null"`
	Plan            B2CSubscriptionPlanModel `gorm:"foreignKey:PlanID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Status          string                   `gorm:"not null;type:varchar(50);default:'pending';index"`
	Amount          int64                    `gorm:"not null"` // Final amount, in IDR
	PaymentProvider string                   `gorm:"not null;type:varchar(50);default:'midtrans'"`
	PaymentOrderID  string                   `gorm:"uniqueIndex;not null;type:varchar(255)"`
	PaymentToken    string                   `gorm:"type:text;default:''"`
	PaymentType     string                   `gorm:"type:varchar(50);default:''"`
	ProviderPayload string                   `gorm:"not null;type:jsonb;default:'{}'"`
	PaidAt          *time.Time               `gorm:"type:timestamp"`
	ExpiredAt       *time.Time               `gorm:"type:timestamp"`
	CreatedAt       time.Time                `gorm:"not null"`
	UpdatedAt       time.Time                `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (B2CSubscriptionModel) TableName() string {
	return "b2c_player_subscriptions"
}

// ToDomain maps B2CSubscriptionModel to domain.B2CSubscription.
func (m *B2CSubscriptionModel) ToDomain() *domain.B2CSubscription {
	if m == nil {
		return nil
	}
	sub := &domain.B2CSubscription{
		ID:              m.ID,
		UserID:          m.UserID,
		PlanID:          m.PlanID,
		Status:          m.Status,
		Amount:          m.Amount,
		PaymentProvider: m.PaymentProvider,
		PaymentOrderID:  m.PaymentOrderID,
		PaymentToken:    m.PaymentToken,
		PaymentType:     m.PaymentType,
		ProviderPayload: m.ProviderPayload,
		PaidAt:          m.PaidAt,
		ExpiredAt:       m.ExpiredAt,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}

	if m.Plan.ID != 0 {
		sub.Plan = m.Plan.ToDomain()
	}

	if m.User.ID != 0 {
		sub.User = m.User.ToDomain()
	}

	return sub
}

// B2CSubscriptionFromDomain maps domain.B2CSubscription to B2CSubscriptionModel.
func B2CSubscriptionFromDomain(d *domain.B2CSubscription) *B2CSubscriptionModel {
	if d == nil {
		return nil
	}
	model := &B2CSubscriptionModel{
		ID:              d.ID,
		UserID:          d.UserID,
		PlanID:          d.PlanID,
		Status:          d.Status,
		Amount:          d.Amount,
		PaymentProvider: d.PaymentProvider,
		PaymentOrderID:  d.PaymentOrderID,
		PaymentToken:    d.PaymentToken,
		PaymentType:     d.PaymentType,
		ProviderPayload: d.ProviderPayload,
		PaidAt:          d.PaidAt,
		ExpiredAt:       d.ExpiredAt,
		CreatedAt:       d.CreatedAt,
		UpdatedAt:       d.UpdatedAt,
	}

	if d.Plan != nil {
		model.Plan = *B2CSubscriptionPlanFromDomain(d.Plan)
	}

	return model
}
