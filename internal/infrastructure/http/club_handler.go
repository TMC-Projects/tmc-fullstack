package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
	"strconv"
	"strings"
	"time"
)

type ClubHandler struct {
	clubUsecase domain.ClubUsecase
}

func NewClubHandler(clubUsecase domain.ClubUsecase) *ClubHandler {
	return &ClubHandler{
		clubUsecase: clubUsecase,
	}
}

type clubRequest struct {
	Name            string     `json:"name"`
	Address         string     `json:"address"`
	Country         string     `json:"country"`
	EstablishedYear int        `json:"established_year"`
	Category        string     `json:"category"`
	Status          string     `json:"status"`
	OrganizationName string    `json:"organization_name"`
	NIB             string     `json:"nib"`
	NPWP            string     `json:"npwp"`
	ExpiredDate     *time.Time `json:"expired_date"`
}

func (h *ClubHandler) Create(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req clubRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Name == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "club name is required", nil)
	}

	input := &domain.Club{
		Name:            req.Name,
		Address:         req.Address,
		Country:         req.Country,
		EstablishedYear: req.EstablishedYear,
		Category:        req.Category,
		Status:          req.Status,
		OrganizationName: req.OrganizationName,
		NIB:             req.NIB,
		NPWP:            req.NPWP,
		ExpiredDate:     req.ExpiredDate,
	}

	// Default status if empty
	if input.Status == "" {
		input.Status = "trial"
	}
	if input.Category == "" {
		input.Category = "club"
	}

	club, err := h.clubUsecase.CreateClub(c.UserContext(), input, userID)
	if err != nil {
		return err // Usecase returns AppError
	}

	return SendSuccess(c, fiber.StatusCreated, "Club created successfully", club)
}

func (h *ClubHandler) Update(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	clubIDStr := c.Params("id")
	clubID, err := strconv.ParseInt(clubIDStr, 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid club ID", err)
	}

	var req clubRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := &domain.Club{
		Name:            req.Name,
		Address:         req.Address,
		Country:         req.Country,
		EstablishedYear: req.EstablishedYear,
		Category:        req.Category,
		Status:          req.Status,
		OrganizationName: req.OrganizationName,
		NIB:             req.NIB,
		NPWP:            req.NPWP,
		ExpiredDate:     req.ExpiredDate,
	}

	club, err := h.clubUsecase.UpdateClub(c.UserContext(), clubID, input, userID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Club updated successfully", club)
}

// GetClubs retrieves all clubs globally (only verified)
func (h *ClubHandler) GetClubs(c *fiber.Ctx) error {
	clubs, err := h.clubUsecase.GetAllClubs(c.UserContext())
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to get clubs", err)
	}
	
	var verifiedClubs []*domain.Club
	for _, club := range clubs {
		if club.Verify {
			verifiedClubs = append(verifiedClubs, club)
		}
	}
	
	// ensure empty array is returned instead of null
	if verifiedClubs == nil {
		verifiedClubs = []*domain.Club{}
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully fetched clubs", verifiedClubs)
}

// GetClubDetail retrieves a single club by its ID globally
func (h *ClubHandler) GetClubDetail(c *fiber.Ctx) error {
	clubIDStr := c.Params("id")
	clubID, err := strconv.ParseInt(clubIDStr, 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid club ID", err)
	}

	club, err := h.clubUsecase.GetClubByID(c.UserContext(), clubID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully fetched club detail", club)
}

// UploadLogo handles uploading a club's logo
func (h *ClubHandler) UploadLogo(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	_, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	clubIDStr := c.Params("id")
	clubID, err := strconv.ParseInt(clubIDStr, 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid club ID", err)
	}

	file, err := c.FormFile("logo")
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "logo file is required", err)
	}

	// Basic validation for file size (5MB max)
	if file.Size > 5*1024*1024 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "file size must be less than 5MB", nil)
	}

	// Validate content type (allow jpeg, png, webp)
	contentType := file.Header.Get("Content-Type")
	if contentType != "image/jpeg" && contentType != "image/png" && contentType != "image/webp" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid file type, only jpeg, png, and webp are allowed", nil)
	}

	// Construct filename and path
	// Use strings.ReplaceAll from strings package, so we need to make sure strings is imported.
	filename := strings.ReplaceAll(file.Filename, " ", "_")
	fileNameWithID := time.Now().Format("20060102150405") + "_" + filename
	savePath := "./uploads/clubs/" + fileNameWithID
	fileURL := "/uploads/clubs/" + fileNameWithID

	// Save file to local disk
	if err := c.SaveFile(file, savePath); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to save logo", err)
	}

	// Update club logo URL in database
	if err := h.clubUsecase.UploadLogo(c.UserContext(), clubID, fileURL); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Club logo uploaded successfully", map[string]string{
		"logo_url": fileURL,
	})
}


// GetByID retrieves a single club by its ID for authenticated users
func (h *ClubHandler) GetByID(c *fiber.Ctx) error {
	clubIDStr := c.Params("id")
	clubID, err := strconv.ParseInt(clubIDStr, 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid club ID", err)
	}

	club, err := h.clubUsecase.GetClubByID(c.UserContext(), clubID)
	if err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully fetched club", club)
}
