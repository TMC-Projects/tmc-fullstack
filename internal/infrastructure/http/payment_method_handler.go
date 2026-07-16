package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// PaymentMethodHandler handles HTTP requests for payment methods.
type PaymentMethodHandler struct {
	usecase domain.PaymentMethodUsecase
}

// NewPaymentMethodHandler creates a new PaymentMethodHandler.
func NewPaymentMethodHandler(u domain.PaymentMethodUsecase) *PaymentMethodHandler {
	return &PaymentMethodHandler{usecase: u}
}

// GetActive returns all active payment methods.
// GET /api/payment-methods
func (h *PaymentMethodHandler) GetActive(c *fiber.Ctx) error {
	methods, err := h.usecase.GetActivePaymentMethods()
	if err != nil {
		if appErr, ok := err.(*domain.AppError); ok {
			return appErr
		}
		return domain.NewAppError(domain.ErrCodeInternal, err.Error(), err)
	}
	return SendSuccess(c, fiber.StatusOK, "Payment methods retrieved successfully", methods)
}
