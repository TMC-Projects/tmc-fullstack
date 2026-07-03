package http

import (
	"njara-platform/internal/domain"
	"strings"

	"github.com/gofiber/fiber/v2"
)

type FeedbackHandler struct {
	feedbackUsecase domain.FeedbackUsecase
}

func NewFeedbackHandler(usecase domain.FeedbackUsecase) *FeedbackHandler {
	return &FeedbackHandler{feedbackUsecase: usecase}
}

func (h *FeedbackHandler) Create(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok || userID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "Unauthorized", nil)
	}

	var req struct {
		Message string `json:"message"`
	}

	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	req.Message = strings.TrimSpace(req.Message)
	if req.Message == "" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Message is required", nil)
	}

	feedback, err := h.feedbackUsecase.SubmitFeedback(c.Context(), uint(userID), req.Message)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to submit feedback", err)
	}

	return SendSuccess(c, fiber.StatusCreated, "Feedback submitted successfully", feedback)
}
