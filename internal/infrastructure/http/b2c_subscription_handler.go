package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// B2CSubscriptionHandler handles HTTP requests for B2C subscription features.
type B2CSubscriptionHandler struct {
	subUsecase domain.B2CSubscriptionUsecase
}

// NewB2CSubscriptionHandler creates a new B2CSubscriptionHandler.
func NewB2CSubscriptionHandler(su domain.B2CSubscriptionUsecase) *B2CSubscriptionHandler {
	return &B2CSubscriptionHandler{subUsecase: su}
}

// GetPlans returns all active B2C subscription plans.
// GET /api/b2c/subscription/plans
func (h *B2CSubscriptionHandler) GetPlans(c *fiber.Ctx) error {
	plans, err := h.subUsecase.GetPlans(c.UserContext())
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "B2C subscription plans retrieved successfully", plans)
}

type createB2CSubscriptionRequest struct {
	PlanID int64 `json:"plan_id"`
}

// CreateSubscription creates a new pending B2C subscription for the authenticated player.
// POST /api/b2c/subscription
func (h *B2CSubscriptionHandler) CreateSubscription(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req createB2CSubscriptionRequest
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

	return SendSuccess(c, fiber.StatusCreated, "B2C subscription created successfully", sub)
}

type chargeB2CPaymentRequest struct {
	PaymentType string `json:"payment_type"` // "bank_transfer", "qris", "gopay", "credit_card", "echannel"
	Bank        string `json:"bank"`         // "bca", "bni", "bri", "permata", "mandiri"
}

// ChargePayment charges the subscription via Midtrans Core API.
// POST /api/b2c/subscription/:id/pay
func (h *B2CSubscriptionHandler) ChargePayment(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	subscriptionID, err := c.ParamsInt("id")
	if err != nil || subscriptionID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid subscription id", err)
	}

	var req chargeB2CPaymentRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}
	if req.PaymentType == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "payment_type is required", nil)
	}

	result, err := h.subUsecase.ChargePayment(c.UserContext(), int64(subscriptionID), req.PaymentType, req.Bank, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Payment charged successfully.", result)
}

// HandleMidtransCallback handles the Midtrans payment notification webhook.
// POST /api/b2c/subscription/callback
func (h *B2CSubscriptionHandler) HandleMidtransCallback(c *fiber.Ctx) error {
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

// GetMySubscription returns the active subscription for the authenticated user.
// GET /api/b2c/subscription/me
func (h *B2CSubscriptionHandler) GetMySubscription(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	sub, err := h.subUsecase.GetMyActiveSubscription(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "B2C subscription retrieved successfully", sub)
}

// GetMyHistory returns all subscriptions for the authenticated user.
// GET /api/b2c/subscription/history
func (h *B2CSubscriptionHandler) GetMyHistory(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	subs, err := h.subUsecase.GetMySubscriptions(c.UserContext(), userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "B2C subscription history retrieved successfully", subs)
}
