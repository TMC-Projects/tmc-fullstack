package domain

import (
	"context"
	"time"
)

// SubscriptionPlan represents a subscription plan that clubs can purchase.
type SubscriptionPlan struct {
	ID             int64
	Name           string
	DurationMonths int
	Price          int64 // Price in IDR (Rupiah)
	Discount       int64 // Discount amount in IDR (Rupiah)
	FinalPrice     int64 // Computed: Price - Discount
	Description    string
	IsActive       bool
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// Subscription represents a subscription transaction from a club.
type Subscription struct {
	ID              int64
	ClubID          int64
	Club            *Club
	PlanID          int64
	Plan            *SubscriptionPlan
	Status          string // "pending", "paid", "failed", "expired"
	Amount          int64  // Final amount paid (after discount) in IDR
	PaymentProvider string // "midtrans", "paypal"
	PaymentOrderID  string // Unique order ID sent to payment provider
	PaymentToken    string // VA number / token returned by provider
	ProviderPayload string // Raw JSON response from provider
	PaidAt          *time.Time
	ExpiredAt       *time.Time
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// MidtransVANumber represents a Virtual Account number from Midtrans.
type MidtransVANumber struct {
	Bank     string `json:"bank"`
	VANumber string `json:"va_number"`
}

// ChargeResult holds the payment details returned after charging via a payment provider.
type ChargeResult struct {
	OrderID         string             `json:"order_id"`
	TransactionID   string             `json:"transaction_id"`
	PaymentType     string             `json:"payment_type"`
	GrossAmount     string             `json:"gross_amount"`
	TransactionTime string             `json:"transaction_time"`
	ExpiryTime      string             `json:"expiry_time,omitempty"`
	VANumbers       []MidtransVANumber `json:"va_numbers,omitempty"`
	PaymentCode     string             `json:"payment_code,omitempty"`
}

// MidtransCallbackPayload represents the notification payload sent by Midtrans to the callback URL.
type MidtransCallbackPayload struct {
	TransactionTime   string `json:"transaction_time"`
	TransactionStatus string `json:"transaction_status"`
	TransactionID     string `json:"transaction_id"`
	StatusCode        string `json:"status_code"`
	StatusMessage     string `json:"status_message"`
	SignatureKey      string `json:"signature_key"`
	PaymentType       string `json:"payment_type"`
	OrderID           string `json:"order_id"`
	MerchantID        string `json:"merchant_id"`
	GrossAmount       string `json:"gross_amount"`
	FraudStatus       string `json:"fraud_status"`
	Currency          string `json:"currency"`
}

// SubscriptionPlanRepository defines the outbound port for SubscriptionPlan persistence.
type SubscriptionPlanRepository interface {
	GetAll(ctx context.Context) ([]*SubscriptionPlan, error)
	GetByID(ctx context.Context, id int64) (*SubscriptionPlan, error)
	Create(ctx context.Context, plan *SubscriptionPlan) error
	Update(ctx context.Context, plan *SubscriptionPlan) error
}

// SubscriptionRepository defines the outbound port for Subscription persistence.
type SubscriptionRepository interface {
	Create(ctx context.Context, sub *Subscription) error
	GetByID(ctx context.Context, id int64) (*Subscription, error)
	GetByOrderID(ctx context.Context, orderID string) (*Subscription, error)
	GetByClubID(ctx context.Context, clubID int64) ([]*Subscription, error)
	Update(ctx context.Context, sub *Subscription) error
}

// SubscriptionUsecase defines the inbound port for subscription business logic.
type SubscriptionUsecase interface {
	GetPlans(ctx context.Context) ([]*SubscriptionPlan, error)
	CreateSubscription(ctx context.Context, planID int64, userID int64) (*Subscription, error)
	ChargePayment(ctx context.Context, subscriptionID int64, bank string, userID int64) (*ChargeResult, error)
	HandleMidtransCallback(ctx context.Context, payload MidtransCallbackPayload) error
	GetMySubscriptions(ctx context.Context, userID int64) ([]*Subscription, error)
}
