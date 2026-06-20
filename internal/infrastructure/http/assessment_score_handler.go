package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type AssessmentScoreHandler struct {
	scoreUsecase domain.AssessmentScoreUsecase
}

func NewAssessmentScoreHandler(scoreUsecase domain.AssessmentScoreUsecase) *AssessmentScoreHandler {
	return &AssessmentScoreHandler{scoreUsecase: scoreUsecase}
}

type addScoresRequest struct {
	Scores []domain.ScoreInput `json:"scores"`
}

func (h *AssessmentScoreHandler) AddScores(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	assessmentID, err := strconv.ParseInt(c.Params("assessment_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid assessment id", err)
	}

	var req addScoresRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	scores, err := h.scoreUsecase.AddScores(c.Context(), assessmentID, req.Scores, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Scores added successfully", scores)
}

func (h *AssessmentScoreHandler) GetScores(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	assessmentID, err := strconv.ParseInt(c.Params("assessment_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid assessment id", err)
	}

	scores, err := h.scoreUsecase.GetScores(c.Context(), assessmentID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Scores fetched successfully", scores)
}
