package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
	"strings"
	"time"
)

// AuthHandler coordinates presentation logic for auth and profiles.
type AuthHandler struct {
	authUsecase domain.AuthUsecase
}

// NewAuthHandler creates a new AuthHandler.
func NewAuthHandler(au domain.AuthUsecase) *AuthHandler {
	return &AuthHandler{authUsecase: au}
}

type registerRequest struct {
	Username     string `json:"username"`
	Email        string `json:"email"`
	Password     string `json:"password"`
	FullName     string `json:"full_name"`
	Language     string `json:"language"`
	Bio          string `json:"bio"`
	Category      string     `json:"category"`
	ContractUntil *time.Time `json:"contract_until"`
	Salary        *int64     `json:"salary"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type userResponse struct {
	ID           int64  `json:"id"`
	Username     string `json:"username"`
	Email        string `json:"email"`
	FullName     string `json:"full_name"`
	Language     string `json:"language"`
	Bio          string `json:"bio"`
	ClubID       int64  `json:"club_id"`
	ClubName     string `json:"club_name,omitempty"`
	ClubLogoUrl  string `json:"club_logo_url,omitempty"`
	Verify       bool   `json:"verify"`
	Category     string `json:"category"`
	ContractUntil *time.Time `json:"contract_until"`
	Salary        *int64     `json:"salary"`
	Stats         []domain.UserStat        `json:"stats"`
	Achievements  []domain.UserAchievement `json:"achievements"`
	Highlights    []domain.UserHighlight   `json:"highlights"`
	SocialMedias  []domain.UserSocialMedia `json:"social_medias"`
	ProfilePictureUrl string `json:"profile_picture_url"`
}

type authResponse struct {
	Token        string       `json:"token"`
	RefreshToken string       `json:"refresh_token"`
	User         userResponse `json:"user"`
}

func toUserResponse(u *domain.User) userResponse {
	return userResponse{
		ID:          u.ID,
		Username:    u.Username,
		Email:       u.Email,
		FullName:    u.FullName,
		Language:    u.Language,
		Bio:         u.Bio,
		ClubID:      u.ClubID,
		ClubName:    func() string {
			if u.Club != nil {
				return u.Club.Name
			}
			return ""
		}(),
		ClubLogoUrl: func() string {
			if u.Club != nil {
				return u.Club.LogoUrl
			}
			return ""
		}(),
		Verify: func() bool {
			if u.Club != nil {
				return u.Club.Verify
			}
			return false
		}(),
		Category:      u.Category,
		ContractUntil: u.ContractUntil,
		Salary:        u.Salary,
		Stats:         u.Stats,
		Achievements:  u.Achievements,
		Highlights:    u.Highlights,
		SocialMedias:  u.SocialMedias,
		ProfilePictureUrl: u.ProfilePictureUrl,
	}
}

// Register maps GoFiber request to Usecase and responds with the registered user profile.
func (h *AuthHandler) Register(c *fiber.Ctx) error {
	var req registerRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Username == "" || req.Email == "" || req.Password == "" || req.FullName == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "username, email, password, and full_name are required", nil)
	}

	input := domain.RegisterInput{
		Username:     req.Username,
		Email:        req.Email,
		Password:     req.Password,
		FullName:     req.FullName,
		Language:     req.Language,
		Bio:          req.Bio,
		Category:      req.Category,
		ContractUntil: req.ContractUntil,
		Salary:        req.Salary,
	}

	res, err := h.authUsecase.Register(c.UserContext(), input)
	if err != nil {
		// Use ErrCodeBadRequest or rely on usecase error
		return domain.NewAppError(domain.ErrCodeBadRequest, err.Error(), err)
	}

	return SendSuccess(c, fiber.StatusCreated, "User registered successfully", authResponse{
		Token:        res.Token,
		RefreshToken: res.RefreshToken,
		User:         toUserResponse(res.User),
	})
}

// Login handles credentials validation and returns token in GoFiber response.
func (h *AuthHandler) Login(c *fiber.Ctx) error {
	var req loginRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Email == "" || req.Password == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "email and password are required", nil)
	}

	input := domain.LoginInput{
		Email:    req.Email,
		Password: req.Password,
	}

	res, err := h.authUsecase.Login(c.UserContext(), input)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, err.Error(), err)
	}

	return SendSuccess(c, fiber.StatusOK, "Login successful", authResponse{
		Token:        res.Token,
		RefreshToken: res.RefreshToken,
		User:         toUserResponse(res.User),
	})
}

type refreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// RefreshToken handles token refresh
func (h *AuthHandler) RefreshToken(c *fiber.Ctx) error {
	var req refreshTokenRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.RefreshToken == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "refresh_token is required", nil)
	}

	res, err := h.authUsecase.RefreshToken(c.UserContext(), req.RefreshToken)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, err.Error(), err)
	}

	return SendSuccess(c, fiber.StatusOK, "Token refreshed successfully", authResponse{
		Token:        res.Token,
		RefreshToken: res.RefreshToken,
		User:         toUserResponse(res.User),
	})
}

// GetProfile handles authenticated profile lookup.
func (h *AuthHandler) GetProfile(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	user, err := h.authUsecase.GetProfile(c.UserContext(), userID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeNotFound, err.Error(), err)
	}

	return SendSuccess(c, fiber.StatusOK, "Profile retrieved successfully", toUserResponse(user))
}

type updateProfileRequest struct {
	FullName string `json:"full_name"`
	Bio      string `json:"bio"`
	Language string `json:"language"`
}

// UpdateProfile handles updating the authenticated user's main profile.
func (h *AuthHandler) UpdateProfile(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	var req updateProfileRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.FullName == "" {
		return domain.NewAppError(domain.ErrCodeValidation, "full_name is required", nil)
	}

	input := domain.UpdateProfileInput{
		FullName: req.FullName,
		Bio:      req.Bio,
		Language: req.Language,
	}

	user, err := h.authUsecase.UpdateProfile(c.UserContext(), userID, input)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, err.Error(), err)
	}

	return SendSuccess(c, fiber.StatusOK, "Profile updated successfully", toUserResponse(user))
}

type logoutRequest struct {
	RefreshToken string `json:"refresh_token"`
}

// Logout handles token invalidation
func (h *AuthHandler) Logout(c *fiber.Ctx) error {
	// 1. Block the access token
	authHeader := c.Get("Authorization")
	parts := strings.Split(authHeader, " ")
	if len(parts) == 2 && strings.ToLower(parts[0]) == "bearer" {
		accessToken := parts[1]
		_ = h.authUsecase.Logout(c.UserContext(), accessToken)
	}

	// 2. Block the refresh token if provided
	var req logoutRequest
	if err := c.BodyParser(&req); err == nil && req.RefreshToken != "" {
		_ = h.authUsecase.Logout(c.UserContext(), req.RefreshToken)
	}

	return SendSuccess(c, fiber.StatusOK, "Logout successful", nil)
}

// UploadProfilePhoto handles uploading a user's profile picture
func (h *AuthHandler) UploadProfilePhoto(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	userID, ok := userIDVal.(int64)
	if !ok {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	file, err := c.FormFile("photo")
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "photo is required", err)
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
	filename := strings.ReplaceAll(file.Filename, " ", "_")
	fileNameWithID := time.Now().Format("20060102150405") + "_" + filename
	savePath := "./uploads/profiles/" + fileNameWithID
	fileURL := "/uploads/profiles/" + fileNameWithID

	// Save file to local disk
	if err := c.SaveFile(file, savePath); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to save photo", err)
	}

	// Update user profile picture URL in database
	if err := h.authUsecase.UpdateProfilePicture(c.UserContext(), userID, fileURL); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to update profile picture record", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Profile picture uploaded successfully", map[string]string{
		"profile_picture_url": fileURL,
	})
}
