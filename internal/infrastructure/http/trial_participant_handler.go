package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type TrialParticipantHandler struct {
	participantUsecase domain.TrialParticipantUsecase
}

func NewTrialParticipantHandler(participantUsecase domain.TrialParticipantUsecase) *TrialParticipantHandler {
	return &TrialParticipantHandler{participantUsecase: participantUsecase}
}

func (h *TrialParticipantHandler) GetByTrial(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	trialID, err := strconv.ParseInt(c.Params("trial_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	participants, err := h.participantUsecase.GetParticipantsByTrial(c.Context(), trialID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Participants fetched successfully", participants)
}

type updateAttendanceRequest struct {
	AttendanceStatus string `json:"attendance_status"`
}

func (h *TrialParticipantHandler) UpdateAttendance(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	participantID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid participant id", err)
	}

	var req updateAttendanceRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	participant, err := h.participantUsecase.UpdateAttendance(c.Context(), participantID, req.AttendanceStatus, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Participant attendance updated successfully", participant)
}

type updateStageRequest struct {
	CurrentStage string `json:"current_stage"`
}

func (h *TrialParticipantHandler) UpdateStage(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	participantID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid participant id", err)
	}

	var req updateStageRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	participant, err := h.participantUsecase.UpdateStage(c.Context(), participantID, req.CurrentStage, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Participant stage updated successfully", participant)
}
