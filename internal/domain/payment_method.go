package domain

import "time"

// PaymentMethod represents a payment method that can be used for subscription.
type PaymentMethod struct {
	ID        int64     `json:"id"`
	Name      string    `json:"name"`
	Code      string    `json:"code"`
	Bank      string    `json:"bank,omitempty"`
	Type      string    `json:"type"`
	IsActive  bool      `json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// PaymentMethodRepository provides access to payment method data.
type PaymentMethodRepository interface {
	GetActivePaymentMethods() ([]PaymentMethod, error)
	GetByCode(code string) (*PaymentMethod, error)
}

// PaymentMethodUsecase provides business logic for payment methods.
type PaymentMethodUsecase interface {
	GetActivePaymentMethods() ([]PaymentMethod, error)
}
