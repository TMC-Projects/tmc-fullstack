package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type TrialApplicationHandler struct {
	appUsecase domain.TrialApplicationUsecase
}

func NewTrialApplicationHandler(appUsecase domain.TrialApplicationUsecase) *TrialApplicationHandler {
	return &TrialApplicationHandler{appUsecase: appUsecase}
}

func (h *TrialApplicationHandler) Apply(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	trialID, err := strconv.ParseInt(c.Params("trial_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	app, err := h.appUsecase.Apply(c.Context(), trialID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Application submitted successfully", app)
}

func (h *TrialApplicationHandler) GetByTrial(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	trialID, err := strconv.ParseInt(c.Params("trial_id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid trial id", err)
	}

	apps, err := h.appUsecase.GetApplicationsByTrial(c.Context(), trialID, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Applications fetched successfully", apps)
}

func (h *TrialApplicationHandler) GetMyApplications(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	apps, err := h.appUsecase.GetMyApplications(c.Context(), callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "My applications fetched successfully", apps)
}

type reviewApplicationRequest struct {
	Remarks string `json:"remarks"`
}

func (h *TrialApplicationHandler) Shortlist(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	appID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid application id", err)
	}

	var req reviewApplicationRequest
	_ = c.BodyParser(&req) // remarks are optional

	app, err := h.appUsecase.Shortlist(c.Context(), appID, req.Remarks, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Application shortlisted successfully", app)
}

func (h *TrialApplicationHandler) Reject(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	appID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid application id", err)
	}

	var req reviewApplicationRequest
	_ = c.BodyParser(&req)

	app, err := h.appUsecase.Reject(c.Context(), appID, req.Remarks, callerID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Application rejected successfully", app)
}
