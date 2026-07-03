package http

import (
	"strconv"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

type TeamInvitationHandler struct {
	usecase domain.TeamInvitationUsecase
}

func NewTeamInvitationHandler(usecase domain.TeamInvitationUsecase) *TeamInvitationHandler {
	return &TeamInvitationHandler{usecase: usecase}
}

func (h *TeamInvitationHandler) GetMyInvitations(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok || userID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	invitations, err := h.usecase.GetMyInvitations(c.Context(), userID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch invitations", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Invitations retrieved successfully", invitations)
}

type respondInvitationRequest struct {
	Accept bool `json:"accept"`
}

func (h *TeamInvitationHandler) Respond(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok || userID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	invitationID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid invitation ID", err)
	}

	var req respondInvitationRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if err := h.usecase.RespondInvitation(c.Context(), invitationID, userID, req.Accept); err != nil {
		return err
	}

	action := "rejected"
	if req.Accept {
		action = "accepted"
	}
	return SendSuccess(c, fiber.StatusOK, "Invitation "+action+" successfully", nil)
}
