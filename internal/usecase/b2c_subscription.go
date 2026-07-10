package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/rs/zerolog/log"
	"njara-platform/internal/domain"
	midtransClient "njara-platform/internal/infrastructure/midtrans"
)

type b2cSubscriptionUsecase struct {
	repo     domain.B2CSubscriptionRepository
	userRepo domain.UserRepository
	midtrans *midtransClient.Client
}

// NewB2CSubscriptionUsecase creates a new B2C subscription usecase.
func NewB2CSubscriptionUsecase(
	repo domain.B2CSubscriptionRepository,
	userRepo domain.UserRepository,
	midtrans *midtransClient.Client,
) domain.B2CSubscriptionUsecase {
	return &b2cSubscriptionUsecase{
		repo:     repo,
		userRepo: userRepo,
		midtrans: midtrans,
	}
}

// GetPlans returns all active B2C subscription plans.
func (u *b2cSubscriptionUsecase) GetPlans(ctx context.Context) ([]*domain.B2CSubscriptionPlan, error) {
	plans, err := u.repo.GetAllPlans(ctx)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve subscription plans", err)
	}
	return plans, nil
}

// CreateSubscription creates a pending subscription for a B2C player.
func (u *b2cSubscriptionUsecase) CreateSubscription(ctx context.Context, planID int64, userID int64) (*domain.B2CSubscription, error) {
	// Verify user
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}
	if user.Category != "player" {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "only players can subscribe to B2C plans", nil)
	}

	// Verify plan
	plan, err := u.repo.GetPlanByID(ctx, planID)
	if err != nil || plan == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "subscription plan not found", err)
	}
	if !plan.IsActive {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, "subscription plan is not active", nil)
	}

	// Generate unique order ID
	orderID := fmt.Sprintf("B2C-%d-%d-%d", userID, planID, time.Now().Unix())

	sub := &domain.B2CSubscription{
		UserID:          userID,
		PlanID:          plan.ID,
		Status:          "pending",
		Amount:          plan.Price,
		PaymentProvider: "midtrans",
		PaymentOrderID:  orderID,
		PaymentToken:    "",
		ProviderPayload: "{}",
	}

	if err := u.repo.CreateSubscription(ctx, sub); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create subscription", err)
	}

	sub.Plan = plan
	sub.User = user

	return sub, nil
}

// ChargePayment charges the subscription via Midtrans Core API (VA, QRIS, Gopay, OVO, CC).
func (u *b2cSubscriptionUsecase) ChargePayment(ctx context.Context, subscriptionID int64, paymentType string, bank string, userID int64) (*domain.B2CChargeResult, error) {
	// Verify user
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// Fetch subscription
	sub, err := u.repo.GetSubscriptionByID(ctx, subscriptionID)
	if err != nil || sub == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "subscription not found", err)
	}

	// Check ownership
	if sub.UserID != userID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "you do not own this subscription", nil)
	}

	if sub.Status != "pending" {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, fmt.Sprintf("subscription is already in status '%s'", sub.Status), nil)
	}

	// Charge via Midtrans Client
	// paymentType can be: "bank_transfer", "qris", "gopay", "credit_card", "echannel"
	result, err := u.midtrans.ChargeCoreAPI(sub.PaymentOrderID, sub.Amount, paymentType, bank, user)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to charge payment via Midtrans", err)
	}

	// Persist the transaction details
	payloadBytes, _ := json.Marshal(result)
	sub.PaymentToken = result.TransactionID
	sub.PaymentType = paymentType
	if paymentType == "bank_transfer" && bank != "" {
		sub.PaymentType = "bank_transfer_" + bank
	}
	sub.ProviderPayload = string(payloadBytes)

	if err := u.repo.UpdateSubscription(ctx, sub); err != nil {
		log.Error().Err(err).Msg("failed to update subscription after charge")
	}

	// Map generic result to B2CChargeResult
	var vaNumbers []domain.MidtransVANumber
	for _, va := range result.VANumbers {
		vaNumbers = append(vaNumbers, domain.MidtransVANumber{
			Bank:     va.Bank,
			VANumber: va.VANumber,
		})
	}
	
	var actions []domain.MidtransAction
	for _, act := range result.Actions {
		actions = append(actions, domain.MidtransAction{
			Name:   act.Name,
			Method: act.Method,
			URL:    act.URL,
		})
	}

	return &domain.B2CChargeResult{
		OrderID:         result.OrderID,
		TransactionID:   result.TransactionID,
		PaymentType:     result.PaymentType,
		GrossAmount:     result.GrossAmount,
		TransactionTime: result.TransactionTime,
		ExpiryTime:      result.ExpiryTime,
		VANumbers:       vaNumbers,
		PaymentCode:     result.PaymentCode,
		QRISUrl:         result.QRISUrl,
		Actions:         actions,
	}, nil
}

// HandleMidtransCallback processes a Midtrans payment notification.
func (u *b2cSubscriptionUsecase) HandleMidtransCallback(ctx context.Context, payload domain.MidtransCallbackPayload) error {
	// Verify signature from Midtrans
	if !u.midtrans.VerifySignature(payload.OrderID, payload.StatusCode, payload.GrossAmount, payload.SignatureKey) {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid Midtrans signature", nil)
	}

	// Fetch subscription by order ID
	sub, err := u.repo.GetSubscriptionByOrderID(ctx, payload.OrderID)
	if err != nil || sub == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "subscription not found for order: "+payload.OrderID, err)
	}

	switch payload.TransactionStatus {
	case "settlement", "capture":
		// Payment successful
		now := time.Now()

		// Calculate expiry based on plan duration
		plan, err := u.repo.GetPlanByID(ctx, sub.PlanID)
		if err != nil || plan == nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to load subscription plan", err)
		}

		expiredAt := now.AddDate(0, plan.DurationMonths, 0)

		sub.Status = "paid"
		sub.PaidAt = &now
		sub.ExpiredAt = &expiredAt

		if err := u.repo.UpdateSubscription(ctx, sub); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update subscription status", err)
		}

		log.Info().
			Int64("user_id", sub.UserID).
			Str("order_id", payload.OrderID).
			Time("expired_at", expiredAt).
			Msg("B2C Player subscription activated successfully")

	case "deny", "cancel", "expire":
		sub.Status = "failed"
		if err := u.repo.UpdateSubscription(ctx, sub); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update subscription status", err)
		}
		log.Warn().Str("order_id", payload.OrderID).Str("status", payload.TransactionStatus).Msg("B2C Subscription payment failed")

	case "pending":
		// Still waiting for payment, no action needed
		log.Info().Str("order_id", payload.OrderID).Msg("Midtrans notification: payment still pending")
	}

	return nil
}

// GetMySubscriptions returns all B2C subscriptions for the authenticated user.
func (u *b2cSubscriptionUsecase) GetMySubscriptions(ctx context.Context, userID int64) ([]*domain.B2CSubscription, error) {
	subs, err := u.repo.GetSubscriptionsByUserID(ctx, userID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch subscriptions", err)
	}
	return subs, nil
}

func (u *b2cSubscriptionUsecase) GetMyActiveSubscription(ctx context.Context, userID int64) (*domain.B2CSubscription, error) {
	sub, err := u.repo.GetActiveSubscriptionByUserID(ctx, userID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch active subscription", err)
	}
	return sub, nil
}
