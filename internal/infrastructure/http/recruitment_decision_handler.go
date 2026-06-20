package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type RecruitmentDecisionHandler struct {
	decisionUsecase domain.RecruitmentDecisionUsecase
}

func NewRecruitmentDecisionHandler(decisionUsecase domain.RecruitmentDecisionUsecase) *RecruitmentDecisionHandler {
	return &RecruitmentDecisionHandler{decisionUsecase: decisionUsecase}
}

type createDecisionRequest struct {
	TrialID       int64  `json:"trial_id"`
	ParticipantID int64  `json:"participant_id"`
	Decision      string `json:"decision"`
	Remarks       string `json:"remarks"`
}

func (h *RecruitmentDecisionHandler) Create(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req createDecisionRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.CreateDecisionInput{
		TrialID:       req.TrialID,
		ParticipantID: req.ParticipantID,
		Decision:      req.Decision,
		Remarks:       req.Remarks,
	}

	decision, err := h.decisionUsecase.CreateDecision(c.Context(), input, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Recruitment decision created successfully", decision)
}

func (h *RecruitmentDecisionHandler) GetByTrial(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	trialID, err := strconv.ParseInt(c.Params("trial_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	decisions, err := h.decisionUsecase.GetDecisionsByTrial(c.Context(), trialID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Recruitment decisions fetched successfully", decisions)
}
