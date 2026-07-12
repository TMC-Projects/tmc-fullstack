package http

import (
	"fmt"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

type TeamHandler struct {
	usecase domain.TeamUsecase
	storage domain.StorageService
}

func NewTeamHandler(usecase domain.TeamUsecase, storage domain.StorageService) *TeamHandler {
	return &TeamHandler{usecase: usecase, storage: storage}
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

func (h *TeamHandler) ReleaseMember(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	adminUserID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	var req assignMemberRequest // Re-using the same request struct since it only takes user_id
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	if req.UserID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "user_id is required", nil)
	}

	err = h.usecase.ReleaseUser(c.Context(), teamID, req.UserID, adminUserID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "User released from team successfully", nil)
}

// UploadLogo handles uploading a team's logo
func (h *TeamHandler) UploadLogo(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	teamID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid team ID", err)
	}

	file, err := c.FormFile("logo")
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "logo file is required", err)
	}

	// Validate file type
	ext := filepath.Ext(file.Filename)
	if ext != ".jpg" && ext != ".jpeg" && ext != ".png" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid file type, only jpg/jpeg/png allowed", nil)
	}

	// Create unique filename
	filename := fmt.Sprintf("%d_%d%s", teamID, time.Now().Unix(), ext)
	objectName := "teams/" + filename

	fileContent, err := file.Open()
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to open logo file", err)
	}
	defer fileContent.Close()

	if h.storage == nil {
		return domain.NewAppError(domain.ErrCodeInternal, "storage service is not configured", nil)
	}

	fileURL, err := h.storage.UploadFile(c.Context(), fileContent, file.Size, file.Header.Get("Content-Type"), objectName)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to upload logo to storage", err)
	}

	// Update team logo URL in database
	if err := h.usecase.UploadLogo(c.UserContext(), teamID, fileURL, userID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Team logo uploaded successfully", map[string]string{
		"logo_url": fileURL,
	})
}
