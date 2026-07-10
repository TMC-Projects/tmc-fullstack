package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// SubscriptionHandler handles HTTP requests for the subscription feature.
type SubscriptionHandler struct {
	subUsecase domain.SubscriptionUsecase
}

// NewSubscriptionHandler creates a new SubscriptionHandler.
func NewSubscriptionHandler(su domain.SubscriptionUsecase) *SubscriptionHandler {
	return &SubscriptionHandler{subUsecase: su}
}

// GetPlans returns all active subscription plans.
// GET /api/subscriptions/plans
func (h *SubscriptionHandler) GetPlans(c *fiber.Ctx) error {
	plans, err := h.subUsecase.GetPlans(c.UserContext())
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Subscription plans retrieved successfully", plans)
}

type createSubscriptionRequest struct {
	PlanID int64 `json:"plan_id"`
}

// CreateSubscription creates a new pending subscription for the authenticated owner's club.
// POST /api/subscriptions
func (h *SubscriptionHandler) CreateSubscription(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req createSubscriptionRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}
	if req.PlanID == 0 {
		return domain.NewAppError(domain.ErrCodeValidation, "plan_id is required", nil)
	}

	sub, err := h.subUsecase.CreateSubscription(c.UserContext(), req.PlanID, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Subscription created successfully", sub)
}

type chargePaymentRequest struct {
	PaymentType string `json:"payment_type"`
	Bank        string `json:"bank"` // "bca", "bni", "bri", "permata", "mandiri"
}

// ChargePayment charges the subscription via Midtrans bank transfer.
// POST /api/subscriptions/:id/pay
func (h *SubscriptionHandler) ChargePayment(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	subscriptionID, err := c.ParamsInt("id")
	if err != nil || subscriptionID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid subscription id", err)
	}

	var req chargePaymentRequest
	// Ignore parse error
	_ = c.BodyParser(&req)

	result, err := h.subUsecase.ChargePayment(c.UserContext(), int64(subscriptionID), req.PaymentType, req.Bank, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Payment charged successfully. Please complete payment via the provided VA number.", result)
}

// HandleMidtransCallback handles the Midtrans payment notification webhook.
// POST /api/subscriptions/callback
func (h *SubscriptionHandler) HandleMidtransCallback(c *fiber.Ctx) error {
	var payload domain.MidtransCallbackPayload
	if err := c.BodyParser(&payload); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid callback payload", err)
	}

	if err := h.subUsecase.HandleMidtransCallback(c.UserContext(), payload); err != nil {
		return err
	}

	// Midtrans expects a 200 OK response, no body required
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"status": "ok"})
}

// GetMySubscriptions returns all subscriptions for the authenticated user's club.
// GET /api/subscriptions/my-club
func (h *SubscriptionHandler) GetMySubscriptions(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	subs, err := h.subUsecase.GetMySubscriptions(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Subscriptions retrieved successfully", subs)
}
