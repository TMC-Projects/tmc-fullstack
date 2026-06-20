package http

import (
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type TeamHandler struct {
	usecase domain.TeamUsecase
}

func NewTeamHandler(usecase domain.TeamUsecase) *TeamHandler {
	return &TeamHandler{usecase: usecase}
}

func (h *TeamHandler) Create(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var input domain.Team
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	if input.Name == "" || input.GameID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Missing required fields: Name, GameID", nil)
	}

	team, err := h.usecase.CreateTeam(c.Context(), &input, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusCreated, "Team created successfully", team)
}

func (h *TeamHandler) Update(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	var input domain.Team
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	team, err := h.usecase.UpdateTeam(c.Context(), teamID, &input, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Team updated successfully", team)
}

func (h *TeamHandler) GetList(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	user, ok := c.Locals("user").(*domain.User)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "user not found in context", nil)
	}
	clubID := user.ClubID

	teams, err := h.usecase.GetTeamsByClubID(c.Context(), clubID, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Teams retrieved successfully", teams)
}

func (h *TeamHandler) GetDetail(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	team, err := h.usecase.GetTeamByID(c.Context(), teamID, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Team retrieved successfully", team)
}

func (h *TeamHandler) Delete(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	err = h.usecase.DeleteTeam(c.Context(), teamID, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Team deleted successfully", nil)
}

type assignMemberRequest struct {
	UserID int64 `json:"user_id"`
}

func (h *TeamHandler) AssignMember(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	adminUserID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	var req assignMemberRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	if req.UserID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "user_id is required", nil)
	}

	err = h.usecase.AssignUser(c.Context(), teamID, req.UserID, adminUserID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "User assigned to team successfully", nil)
}
