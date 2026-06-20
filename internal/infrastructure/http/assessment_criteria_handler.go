package http

import (
	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

type AssessmentCriteriaHandler struct {
	criteriaRepo domain.AssessmentCriteriaRepository
}

func NewAssessmentCriteriaHandler(criteriaRepo domain.AssessmentCriteriaRepository) *AssessmentCriteriaHandler {
	return &AssessmentCriteriaHandler{
		criteriaRepo: criteriaRepo,
	}
}

// GetActive retrieves all active assessment criteria.
func (h *AssessmentCriteriaHandler) GetActive(c *fiber.Ctx) error {
	criteria, err := h.criteriaRepo.GetActive(c.UserContext())
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve assessment criteria", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully fetched assessment criteria", criteria)
}
