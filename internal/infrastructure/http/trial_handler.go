package http

import (
	"strconv"
	"strings"
	"time"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

type TrialHandler struct {
	trialUsecase domain.TrialUsecase
	appRepo      domain.TrialApplicationRepository
}

func NewTrialHandler(trialUsecase domain.TrialUsecase, appRepo domain.TrialApplicationRepository) *TrialHandler {
	return &TrialHandler{trialUsecase: trialUsecase, appRepo: appRepo}
}

type createTrialRequest struct {
	GameID          int64     `json:"game_id"`
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	MaxParticipants int       `json:"max_participants"`
}

func (h *TrialHandler) Create(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req createTrialRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.CreateTrialInput{
		GameID:          req.GameID,
		Title:           req.Title,
		Description:     req.Description,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		MaxParticipants: req.MaxParticipants,
	}

	trial, err := h.trialUsecase.CreateTrial(c.Context(), input, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Trial created successfully", trial)
}

type updateTrialRequest struct {
	Title           string    `json:"title"`
	Description     string    `json:"description"`
	GameID          int64     `json:"game_id"`
	StartDate       time.Time `json:"start_date"`
	EndDate         time.Time `json:"end_date"`
	MaxParticipants int       `json:"max_participants"`
	Status          string    `json:"status"`
}

func (h *TrialHandler) Update(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	trialID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	var req updateTrialRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	req.Status = strings.ToUpper(req.Status)
	input := domain.UpdateTrialInput{
		Title:           req.Title,
		Description:     req.Description,
		GameID:          req.GameID,
		StartDate:       req.StartDate,
		EndDate:         req.EndDate,
		MaxParticipants: req.MaxParticipants,
		Status:          req.Status,
	}

	trial, err := h.trialUsecase.UpdateTrial(c.Context(), trialID, input, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Trial updated successfully", trial)
}

func (h *TrialHandler) GetList(c *fiber.Ctx) error {
	filter := domain.TrialFilter{
		Status: c.Query("status"),
	}
	if clubID := c.Query("club_id"); clubID != "" {
		filter.ClubID, _ = strconv.ParseInt(clubID, 10, 64)
	}
	if gameID := c.Query("game_id"); gameID != "" {
		filter.GameID, _ = strconv.ParseInt(gameID, 10, 64)
	}
	filter.Page, _ = strconv.Atoi(c.Query("page", "1"))
	filter.Limit, _ = strconv.Atoi(c.Query("limit", "20"))

	trials, total, err := h.trialUsecase.GetTrials(c.Context(), filter)
	if err != nil {
		return err
	}

	type trialResponse struct {
		*domain.Trial
		ParticipantsCount int64 `json:"ParticipantsCount"`
	}

	var res []trialResponse
	for _, t := range trials {
		applied, _ := h.appRepo.CountByTrialAndStatus(c.Context(), t.ID, domain.ApplicationStatusApplied)
		shortlisted, _ := h.appRepo.CountByTrialAndStatus(c.Context(), t.ID, domain.ApplicationStatusShortlisted)
		res = append(res, trialResponse{
			Trial:             t,
			ParticipantsCount: applied + shortlisted,
		})
	}

	return SendSuccess(c, fiber.StatusOK, "Trials fetched successfully", fiber.Map{
		"items": res,
		"total": total,
		"page":  filter.Page,
		"limit": filter.Limit,
	})
}

func (h *TrialHandler) GetDetail(c *fiber.Ctx) error {
	trialID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	trial, err := h.trialUsecase.GetTrialByID(c.Context(), trialID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Trial fetched successfully", trial)
}
