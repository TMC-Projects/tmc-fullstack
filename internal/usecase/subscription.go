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

type subscriptionUsecase struct {
	subRepo     domain.SubscriptionRepository
	planRepo    domain.SubscriptionPlanRepository
	clubRepo    domain.ClubRepository
	userRepo    domain.UserRepository
	midtrans    *midtransClient.Client
}

// NewSubscriptionUsecase creates a new subscription usecase.
func NewSubscriptionUsecase(
	subRepo domain.SubscriptionRepository,
	planRepo domain.SubscriptionPlanRepository,
	clubRepo domain.ClubRepository,
	userRepo domain.UserRepository,
	midtrans *midtransClient.Client,
) domain.SubscriptionUsecase {
	return &subscriptionUsecase{
		subRepo:  subRepo,
		planRepo: planRepo,
		clubRepo: clubRepo,
		userRepo: userRepo,
		midtrans: midtrans,
	}
}

// GetPlans returns all active subscription plans.
func (u *subscriptionUsecase) GetPlans(ctx context.Context) ([]*domain.SubscriptionPlan, error) {
	plans, err := u.planRepo.GetAll(ctx)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve subscription plans", err)
	}
	return plans, nil
}

// CreateSubscription creates a pending subscription for a club.
// Only users with category "owner" who belong to a B2B club can subscribe.
func (u *subscriptionUsecase) CreateSubscription(ctx context.Context, planID int64, userID int64) (*domain.Subscription, error) {
	// Verify user
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}
	if user.Category != "owner" {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "only club owners can subscribe", nil)
	}

	// Verify club
	club, err := u.clubRepo.GetByID(ctx, user.ClubID)
	if err != nil || club == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "club not found", err)
	}

	// Verify plan
	plan, err := u.planRepo.GetByID(ctx, planID)
	if err != nil || plan == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "subscription plan not found", err)
	}
	if !plan.IsActive {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, "subscription plan is not active", nil)
	}

	// Generate unique order ID
	orderID := fmt.Sprintf("SUB-%d-%d-%d", club.ID, planID, time.Now().Unix())

	sub := &domain.Subscription{
		ClubID:          club.ID,
		PlanID:          plan.ID,
		Status:          "pending",
		Amount:          plan.FinalPrice,
		PaymentProvider: "midtrans",
		PaymentOrderID:  orderID,
		PaymentToken:    "",
		ProviderPayload: "{}",
	}

	if err := u.subRepo.Create(ctx, sub); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create subscription", err)
	}

	sub.Plan = plan
	sub.Club = club

	return sub, nil
}

// ChargePayment charges the subscription via Midtrans bank transfer.
// Only the owner of the club that owns the subscription can trigger payment.
func (u *subscriptionUsecase) ChargePayment(ctx context.Context, subscriptionID int64, bank string, userID int64) (*domain.ChargeResult, error) {
	// Verify user
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}
	if user.Category != "owner" {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "only club owners can charge payment", nil)
	}

	// Fetch subscription
	sub, err := u.subRepo.GetByID(ctx, subscriptionID)
	if err != nil || sub == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "subscription not found", err)
	}

	// Check ownership
	if sub.ClubID != user.ClubID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "you do not own this subscription", nil)
	}

	if sub.Status != "pending" {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, fmt.Sprintf("subscription is already in status '%s'", sub.Status), nil)
	}

	// Charge via Midtrans
	if bank == "" {
		bank = "bca"
	}

	result, err := u.midtrans.ChargeBankTransfer(sub.PaymentOrderID, sub.Amount, bank)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to charge payment via Midtrans", err)
	}

	// Persist the VA token and raw payload
	payloadBytes, _ := json.Marshal(result)
	sub.PaymentToken = result.TransactionID
	sub.ProviderPayload = string(payloadBytes)

	if err := u.subRepo.Update(ctx, sub); err != nil {
		log.Error().Err(err).Msg("failed to update subscription after charge")
	}

	// Build response
	vaNumbers := make([]domain.MidtransVANumber, len(result.VANumbers))
	for i, va := range result.VANumbers {
		vaNumbers[i] = domain.MidtransVANumber{
			Bank:     va.Bank,
			VANumber: va.VANumber,
		}
	}

	return &domain.ChargeResult{
		OrderID:         result.OrderID,
		TransactionID:   result.TransactionID,
		PaymentType:     result.PaymentType,
		GrossAmount:     result.GrossAmount,
		TransactionTime: result.TransactionTime,
		ExpiryTime:      result.ExpiryTime,
		VANumbers:       vaNumbers,
	}, nil
}

// HandleMidtransCallback processes a Midtrans payment notification.
// It verifies the signature, updates the subscription, and activates the club on success.
func (u *subscriptionUsecase) HandleMidtransCallback(ctx context.Context, payload domain.MidtransCallbackPayload) error {
	// Verify signature from Midtrans
	if !u.midtrans.VerifySignature(payload.OrderID, payload.StatusCode, payload.GrossAmount, payload.SignatureKey) {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid Midtrans signature", nil)
	}

	// Fetch subscription by order ID
	sub, err := u.subRepo.GetByOrderID(ctx, payload.OrderID)
	if err != nil || sub == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "subscription not found for order: "+payload.OrderID, err)
	}

	switch payload.TransactionStatus {
	case "settlement", "capture":
		// Payment successful
		now := time.Now()

		// Calculate expiry based on plan duration
		plan, err := u.planRepo.GetByID(ctx, sub.PlanID)
		if err != nil || plan == nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to load subscription plan", err)
		}

		expiredAt := now.AddDate(0, plan.DurationMonths, 0)

		sub.Status = "paid"
		sub.PaidAt = &now
		sub.ExpiredAt = &expiredAt

		if err := u.subRepo.Update(ctx, sub); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update subscription status", err)
		}

		// Activate club: set status to "full" and update expired_date
		club, err := u.clubRepo.GetByID(ctx, sub.ClubID)
		if err != nil || club == nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to load club", err)
		}

		club.Status = "full"
		club.ExpiredDate = &expiredAt

		if err := u.clubRepo.Update(ctx, club); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to activate club", err)
		}

		log.Info().
			Int64("club_id", club.ID).
			Str("order_id", payload.OrderID).
			Time("expired_at", expiredAt).
			Msg("Club subscription activated successfully")

	case "deny", "cancel", "expire":
		sub.Status = "failed"
		if err := u.subRepo.Update(ctx, sub); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update subscription status", err)
		}
		log.Warn().Str("order_id", payload.OrderID).Str("status", payload.TransactionStatus).Msg("Subscription payment failed")

	case "pending":
		// Still waiting for payment, no action needed
		log.Info().Str("order_id", payload.OrderID).Msg("Midtrans notification: payment still pending")
	}

	return nil
}

// GetMySubscriptions returns the list of subscriptions for the authenticated user's club.
func (u *subscriptionUsecase) GetMySubscriptions(ctx context.Context, userID int64) ([]*domain.Subscription, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	subs, err := u.subRepo.GetByClubID(ctx, user.ClubID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch subscriptions", err)
	}

	return subs, nil
}
