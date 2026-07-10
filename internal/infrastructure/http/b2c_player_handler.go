package http

import (
	"github.com/gofiber/fiber/v2"
	"strconv"
	"njara-platform/internal/domain"
)

type B2CPlayerHandler struct {
	authUsecase   domain.AuthUsecase
	followUsecase domain.UserFollowUsecase
}

func NewB2CPlayerHandler(authUsecase domain.AuthUsecase, followUsecase domain.UserFollowUsecase) *B2CPlayerHandler {
	return &B2CPlayerHandler{
		authUsecase:   authUsecase,
		followUsecase: followUsecase,
	}
}

// GetB2CPlayerDetail handles GET /api/b2c/players/:id returning a specific player's full profile if they are a player.
func (h *B2CPlayerHandler) GetB2CPlayerDetail(c *fiber.Ctx) error {
	// The user may or may not be logged in, but our route will require Authentication
	targetIDStr := c.Params("id")
	targetID, err := strconv.ParseInt(targetIDStr, 10, 64)
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	targetUser, err := h.authUsecase.GetProfile(c.UserContext(), targetID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// Only players can be searched and shared in B2C
	if targetUser.Category != "player" {
		return domain.NewAppError(domain.ErrCodeNotFound, "player not found", nil)
	}

	// Fetch followers and following counts
	followersCount, err := h.followUsecase.GetFollowersCount(c.UserContext(), targetID)
	if err != nil {
		followersCount = 0 // graceful fallback
	}

	followingCount, err := h.followUsecase.GetFollowingCount(c.UserContext(), targetID)
	if err != nil {
		followingCount = 0 // graceful fallback
	}

	response := map[string]interface{}{
		"user":            toUserResponse(targetUser),
		"followers_count": followersCount,
		"following_count": followingCount,
	}

	return SendSuccess(c, fiber.StatusOK, "Player retrieved successfully", response)
}

// GetPublicPlayerProfile handles GET /api/public/players/:username
// This endpoint is public and does NOT require authentication.
// It returns a player's or coach's public profile by their username.
func (h *B2CPlayerHandler) GetPublicPlayerProfile(c *fiber.Ctx) error {
	username := c.Params("username")
	if username == "" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "username is required", nil)
	}

	targetUser, err := h.authUsecase.GetProfileByUsername(c.UserContext(), username)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "player not found", err)
	}

	// Only player and coach profiles are publicly accessible
	if targetUser.Category != "player" && targetUser.Category != "coach" {
		return domain.NewAppError(domain.ErrCodeNotFound, "player not found", nil)
	}

	// Fetch followers and following counts
	followersCount, err := h.followUsecase.GetFollowersCount(c.UserContext(), targetUser.ID)
	if err != nil {
		followersCount = 0
	}

	followingCount, err := h.followUsecase.GetFollowingCount(c.UserContext(), targetUser.ID)
	if err != nil {
		followingCount = 0
	}

	response := map[string]interface{}{
		"user":            toUserResponse(targetUser),
		"followers_count": followersCount,
		"following_count": followingCount,
	}

	return SendSuccess(c, fiber.StatusOK, "Player public profile retrieved successfully", response)
}
