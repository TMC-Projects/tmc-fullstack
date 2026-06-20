package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type AssessmentResultHandler struct {
	assessmentUsecase domain.AssessmentResultUsecase
}

func NewAssessmentResultHandler(assessmentUsecase domain.AssessmentResultUsecase) *AssessmentResultHandler {
	return &AssessmentResultHandler{assessmentUsecase: assessmentUsecase}
}

type createAssessmentRequest struct {
	ParticipantID  int64  `json:"participant_id"`
	Recommendation string `json:"recommendation"`
	Summary        string `json:"summary"`
}

func (h *AssessmentResultHandler) Create(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req createAssessmentRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.CreateAssessmentInput{
		ParticipantID:  req.ParticipantID,
		Recommendation: req.Recommendation,
		Summary:        req.Summary,
	}

	assessment, err := h.assessmentUsecase.CreateAssessment(c.Context(), input, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Assessment created successfully", assessment)
}

func (h *AssessmentResultHandler) GetByParticipant(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	participantID, err := strconv.ParseInt(c.Params("participant_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid participant id", err)
	}

	assessments, err := h.assessmentUsecase.GetAssessmentsByParticipant(c.Context(), participantID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Assessments fetched successfully", assessments)
}
