package http

import (
	"github.com/gofiber/fiber/v2"
	"strconv"
	"njara-platform/internal/domain"
	"njara-platform/internal/usecase"
)

// UserHandler handles HTTP requests related to generic user operations.
type UserHandler struct {
	userUsecase usecase.UserUsecase
	authUsecase domain.AuthUsecase
}

// NewUserHandler creates a new instance of UserHandler.
func NewUserHandler(userUsecase usecase.UserUsecase, authUsecase domain.AuthUsecase) *UserHandler {
	return &UserHandler{
		userUsecase: userUsecase,
		authUsecase: authUsecase,
	}
}

// GetListByCategory handles GET /api/:category returning users of a specific category.
// To use a unified handler, we pass the category as a parameter.
func (h *UserHandler) GetListByCategory(category string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("userID")
		userID, ok := userIDVal.(int64)
		if !ok {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
		}

		currentUser, err := h.authUsecase.GetProfile(c.UserContext(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized or user not found", err)
		}

		users, err := h.userUsecase.GetUsersByCategoryAndClub(c.UserContext(), category, currentUser.ClubID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch users", err)
		}

		// Mask sensitive fields like password before sending
		var safeUsers []map[string]interface{}
		for _, u := range users {
			safeUsers = append(safeUsers, map[string]interface{}{
				"id":             u.ID,
				"username":       u.Username,
				"email":          u.Email,
				"full_name":      u.FullName,
				"language":       u.Language,
				"bio":            u.Bio,
				"club_id":        u.ClubID,
				"category":       u.Category,
				"contract_until": u.ContractUntil,
				"salary":         u.Salary,
				"stats":               u.Stats,
				"achievements":        u.Achievements,
				"highlights":          u.Highlights,
				"team_id":             u.TeamID,
				"profile_picture_url": u.ProfilePictureUrl,
				"created_at":          u.CreatedAt,
				"updated_at":          u.UpdatedAt,
			})
		}

		// Ensure we don't return nil array in JSON
		if safeUsers == nil {
			safeUsers = []map[string]interface{}{}
		}

		return SendSuccess(c, fiber.StatusOK, category+"s retrieved successfully", safeUsers)
	}
}

// GetUserDetail handles GET /api/players/:id returning a specific player's full profile.
// It uses authUsecase.GetProfile internally to fetch the target user.
func (h *UserHandler) GetUserDetail(c *fiber.Ctx) error {
	userIDVal := c.Locals("userID")
	callerID, ok := userIDVal.(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetIDStr := c.Params("id")
	targetID, err := strconv.ParseInt(targetIDStr, 10, 64)
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	targetUser, err := h.authUsecase.GetProfile(c.UserContext(), targetID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// We can return the user directly, but we should clear out PasswordHash
	targetUser.PasswordHash = ""

	return SendSuccess(c, fiber.StatusOK, "User retrieved successfully", targetUser)
}
