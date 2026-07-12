package http

import (
	"fmt"
	"path/filepath"
	"strconv"
	"time"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// TalentHandler handles HTTP requests related to talent operations.
type TalentHandler struct {
	talentUsecase domain.TalentUsecase
	storage       domain.StorageService
}

// NewTalentHandler creates a new instance of TalentHandler.
func NewTalentHandler(talentUsecase domain.TalentUsecase, storage domain.StorageService) *TalentHandler {
	return &TalentHandler{
		talentUsecase: talentUsecase,
		storage:       storage,
	}
}

// RegisterTalent handles POST /api/talents
func (h *TalentHandler) RegisterTalent(c *fiber.Ctx) error {
	var input domain.RegisterTalentInput
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeValidation, "invalid JSON body", err)
	}

	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		return domain.NewAppError(domain.ErrCodeValidation, "validation failed", err)
	}

	userIDVal := c.Locals("userID")
	creatorUserID, ok := userIDVal.(int64)
	if !ok || creatorUserID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	newUser, err := h.talentUsecase.RegisterTalent(c.UserContext(), creatorUserID, input)
	if err != nil {
		return err
	}

	response := map[string]interface{}{
		"id":             newUser.ID,
		"username":       newUser.Username,
		"email":          newUser.Email,
		"full_name":      newUser.FullName,
		"category":       newUser.Category,
		"club_id":        newUser.ClubID,
		"contract_until": newUser.ContractUntil,
		"salary":         newUser.Salary,
		"created_at":     newUser.CreatedAt,
	}

	return SendSuccess(c, fiber.StatusCreated, "Talent registered successfully", response)
}

// GetTalents handles GET /api/talents
// Query params:
//   - page            int    (default: 1)
//   - limit           int    (default: 10, max: 100)
//   - search          string search by full_name or username
//   - category        string filter by: "player", "coach", "staff", "ba"
//   - transfer_status string filter by: "available", "transferred", "not_listed"
//
// market_value is only returned when the caller is an owner or manager.
func (h *TalentHandler) GetTalents(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	callerID, _ := c.Locals("userID").(int64)

	var teamID *int64
	if c.Query("team_id") != "" {
		tid, err := strconv.ParseInt(c.Query("team_id"), 10, 64)
		if err == nil {
			teamID = &tid
		}
	}

	filter := domain.TalentFilter{
		Search:         c.Query("search"),
		Category:       c.Query("category"),
		TransferStatus: c.Query("transfer_status"),
		Page:           page,
		Limit:          limit,
		CallerUserID:   callerID,
		TeamID:         teamID,
	}

	result, err := h.talentUsecase.GetTalents(c.UserContext(), filter)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Talents retrieved successfully", result)
}

type updateMarketValueRequest struct {
	MarketValue *int64 `json:"market_value"` // Send null to clear market value
}

// UpdateMarketValue handles PUT /api/talents/:id/market-value
// Only accessible by owner or manager of the same club.
// Only works for player and coach categories.
func (h *TalentHandler) UpdateMarketValue(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var req updateMarketValueRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if err := h.talentUsecase.UpdateMarketValue(c.UserContext(), int64(targetID), req.MarketValue, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Market value updated successfully", nil)
}

// updateContractSalaryRequest defines the request body for updating contract and salary.
type updateContractSalaryRequest struct {
	ContractUntil *string `json:"contract_until"` // Expects "YYYY-MM-DD" or RFC3339 format
	Salary        *int64  `json:"salary"`
}

// UpdateContractAndSalary handles PUT /api/talents/:id/contract-salary
func (h *TalentHandler) UpdateContractAndSalary(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var req updateContractSalaryRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	var parsedDate *time.Time
	if req.ContractUntil != nil && *req.ContractUntil != "" {
		t, err := time.Parse("2006-01-02", *req.ContractUntil)
		if err != nil {
			// Try RFC3339 if standard layout fails
			t, err = time.Parse(time.RFC3339, *req.ContractUntil)
			if err != nil {
				return domain.NewAppError(domain.ErrCodeBadRequest, "invalid contract_until date format, expected YYYY-MM-DD", err)
			}
		}
		parsedDate = &t
	}

	if err := h.talentUsecase.UpdateContractAndSalary(c.UserContext(), int64(targetID), parsedDate, req.Salary, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Contract and salary updated successfully", nil)
}

// UpdateBiodata handles PUT /api/talents/:id/biodata
func (h *TalentHandler) UpdateBiodata(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var input domain.UpdateTalentBiodataInput
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeValidation, "invalid JSON body", err)
	}

	validate := validator.New()
	if err := validate.Struct(input); err != nil {
		return domain.NewAppError(domain.ErrCodeValidation, "validation failed", err)
	}

	if err := h.talentUsecase.UpdateTalentBiodata(c.UserContext(), int64(targetID), input, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Biodata updated successfully", nil)
}

// UploadPhoto handles POST /api/talents/:id/photo
// Only accessible by owner or manager of the same club.
func (h *TalentHandler) UploadPhoto(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	file, err := c.FormFile("photo")
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "photo file is required", err)
	}

	// Basic validation for image file
	ext := filepath.Ext(file.Filename)
	if ext != ".png" && ext != ".jpg" && ext != ".jpeg" && ext != ".webp" {
		return domain.NewAppError(domain.ErrCodeValidation, "only png, jpg, jpeg, webp files are allowed", nil)
	}

	// Generate a unique filename
	fileNameWithID := fmt.Sprintf("talent_%d_%d%s", targetID, time.Now().UnixNano(), ext)
	objectName := "profiles/" + fileNameWithID

	fileContent, err := file.Open()
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to open photo file", err)
	}
	defer fileContent.Close()

	if h.storage == nil {
		return domain.NewAppError(domain.ErrCodeInternal, "storage service is not configured", nil)
	}

	fileURL, err := h.storage.UploadFile(c.Context(), fileContent, file.Size, file.Header.Get("Content-Type"), objectName)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to upload photo to storage", err)
	}

	if err := h.talentUsecase.UpdateProfilePicture(c.UserContext(), int64(targetID), fileURL, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Photo uploaded successfully", map[string]string{
		"profile_picture_url": fileURL,
	})
}

// updateAccountStatusRequest defines the request body for updating status
type updateAccountStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=active inactive"`
}

// UpdateStatus handles PUT /api/talents/:id/status
func (h *TalentHandler) UpdateStatus(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var req updateAccountStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Status != "active" && req.Status != "inactive" {
		return domain.NewAppError(domain.ErrCodeValidation, "status must be active or inactive", nil)
	}

	if err := h.talentUsecase.UpdateStatus(c.UserContext(), int64(targetID), req.Status, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Account status updated successfully", nil)
}

type signFreeAgentRequest struct {
	TeamID *int64 `json:"team_id"`
}

// SignFreeAgent handles POST /api/talents/:id/sign
func (h *TalentHandler) SignFreeAgent(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var req signFreeAgentRequest
	if err := c.BodyParser(&req); err != nil && err.Error() != "Unprocessable Entity" {
		// Body is optional for club owners, but required for team_owners
	}

	if err := h.talentUsecase.SignFreeAgent(c.UserContext(), int64(targetID), callerID, req.TeamID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Player signed successfully", nil)
}
