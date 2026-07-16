package domain

import (
	"context"
	"time"
)

// B2CSubscriptionPlan represents a subscription plan that B2C players can purchase.
type B2CSubscriptionPlan struct {
	ID             int64     `json:"id"`
	Name           string    `json:"name"`
	DurationMonths int       `json:"duration_months"`
	Price          int64     `json:"price"` // Price in IDR (Rupiah)
	Description    string    `json:"description"`
	IsActive       bool      `json:"is_active"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

// B2CSubscription represents a subscription transaction from a player.
type B2CSubscription struct {
	ID              int64                `json:"id"`
	UserID          int64                `json:"user_id"`
	User            *User                `json:"user,omitempty"`
	PlanID          int64                `json:"plan_id"`
	Plan            *B2CSubscriptionPlan `json:"plan,omitempty"`
	Status          string               `json:"status"` // "pending", "paid", "failed", "expired"
	Amount          int64                `json:"amount"` // Final amount paid in IDR
	PaymentProvider string               `json:"payment_provider"` // "midtrans"
	PaymentOrderID  string               `json:"payment_order_id"` // Unique order ID sent to payment provider
	PaymentToken    string               `json:"payment_token"`    // transaction_id or token from provider
	PaymentType     string               `json:"payment_type"`     // "bank_transfer", "qris", "gopay", "echannel"
	ProviderPayload string               `json:"provider_payload"` // Raw JSON response from provider
	PaidAt          *time.Time           `json:"paid_at"`
	ExpiredAt       *time.Time           `json:"expired_at"`
	CreatedAt       time.Time            `json:"created_at"`
	UpdatedAt       time.Time            `json:"updated_at"`
}

// B2CChargeResult holds the payment details returned after charging via Midtrans Core API.
type B2CChargeResult struct {
	OrderID         string             `json:"order_id"`
	TransactionID   string             `json:"transaction_id"`
	PaymentType     string             `json:"payment_type"`
	GrossAmount     string             `json:"gross_amount"`
	TransactionTime string             `json:"transaction_time"`
	ExpiryTime      string             `json:"expiry_time,omitempty"`
	VANumbers       []MidtransVANumber `json:"va_numbers,omitempty"`
	PaymentCode     string             `json:"payment_code,omitempty"` // For Mandiri Bill / Indomaret etc
	QRISUrl         string             `json:"qris_url,omitempty"`     // For QRIS
	Actions         []MidtransAction   `json:"actions,omitempty"`      // For Gopay etc
}

// MidtransAction represents an action object in Midtrans response (e.g. Gopay deeplink/QR)
type MidtransAction struct {
	Name   string `json:"name"`
	Method string `json:"method"`
	URL    string `json:"url"`
}

// B2CSubscriptionRepository defines the outbound port for B2C Subscription persistence.
type B2CSubscriptionRepository interface {
	// Plans
	GetAllPlans(ctx context.Context) ([]*B2CSubscriptionPlan, error)
	GetPlanByID(ctx context.Context, id int64) (*B2CSubscriptionPlan, error)
	CreatePlan(ctx context.Context, plan *B2CSubscriptionPlan) error
	
	// Subscriptions
	CreateSubscription(ctx context.Context, sub *B2CSubscription) error
	GetSubscriptionByID(ctx context.Context, id int64) (*B2CSubscription, error)
	GetSubscriptionByOrderID(ctx context.Context, orderID string) (*B2CSubscription, error)
	GetActiveSubscriptionByUserID(ctx context.Context, userID int64) (*B2CSubscription, error)
	GetSubscriptionsByUserID(ctx context.Context, userID int64) ([]*B2CSubscription, error)
	UpdateSubscription(ctx context.Context, sub *B2CSubscription) error
	
	// Helper for checking premium status
	IsUserPremium(ctx context.Context, userID int64) (bool, error)
}

// B2CSubscriptionUsecase defines the inbound port for B2C subscription business logic.
type B2CSubscriptionUsecase interface {
	GetPlans(ctx context.Context) ([]*B2CSubscriptionPlan, error)
	CreateSubscription(ctx context.Context, planID int64, userID int64) (*B2CSubscription, error)
	ChargePayment(ctx context.Context, subscriptionID int64, paymentMethodCode string, userID int64) (*B2CChargeResult, error)
	HandleMidtransCallback(ctx context.Context, payload MidtransCallbackPayload) error
	GetMySubscriptions(ctx context.Context, userID int64) ([]*B2CSubscription, error)
	GetMyActiveSubscription(ctx context.Context, userID int64) (*B2CSubscription, error)
}
