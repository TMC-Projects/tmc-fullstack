package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// PaymentMethodModel represents a payment method in the database.
type PaymentMethodModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"type:varchar(100);not null"`
	Code      string    `gorm:"type:varchar(50);not null;uniqueIndex"`
	Bank      string    `gorm:"type:varchar(50);default:''"`
	Type      string    `gorm:"type:varchar(50);not null"` // e.g., bank_transfer, echannel, qris, gopay
	IsActive  bool      `gorm:"default:true"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (PaymentMethodModel) TableName() string {
	return "payment_methods"
}

// ToDomain converts the database model to the domain entity.
func (m *PaymentMethodModel) ToDomain() domain.PaymentMethod {
	return domain.PaymentMethod{
		ID:        m.ID,
		Name:      m.Name,
		Code:      m.Code,
		Bank:      m.Bank,
		Type:      m.Type,
		IsActive:  m.IsActive,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}
