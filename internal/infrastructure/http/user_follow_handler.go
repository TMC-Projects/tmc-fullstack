package http

import (
	"github.com/gofiber/fiber/v2"
	"strconv"
	"njara-platform/internal/domain"
)

type UserFollowHandler struct {
	followUsecase domain.UserFollowUsecase
	authUsecase   domain.AuthUsecase
}

func NewUserFollowHandler(followUsecase domain.UserFollowUsecase, authUsecase domain.AuthUsecase) *UserFollowHandler {
	return &UserFollowHandler{
		followUsecase: followUsecase,
		authUsecase:   authUsecase,
	}
}

func (h *UserFollowHandler) parseTargetID(c *fiber.Ctx) (int64, error) {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err == nil && id != 0 {
		return id, nil
	}
	// Fallback to searching by username
	user, err := h.authUsecase.GetProfileByUsername(c.UserContext(), idStr)
	if err != nil {
		return 0, err
	}
	return user.ID, nil
}

// Follow handles POST /api/b2c/users/:id/follow
func (h *UserFollowHandler) Follow(c *fiber.Ctx) error {
	followerIDVal := c.Locals("userID")
	followerID, ok := followerIDVal.(int64)
	if !ok || followerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	followingID, err := h.parseTargetID(c)
	if err != nil || followingID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid target user id", err)
	}

	err = h.followUsecase.Follow(c.UserContext(), followerID, followingID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to follow user", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully followed user", nil)
}

// Unfollow handles DELETE /api/b2c/users/:id/unfollow
func (h *UserFollowHandler) Unfollow(c *fiber.Ctx) error {
	followerIDVal := c.Locals("userID")
	followerID, ok := followerIDVal.(int64)
	if !ok || followerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	followingID, err := h.parseTargetID(c)
	if err != nil || followingID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid target user id", err)
	}

	err = h.followUsecase.Unfollow(c.UserContext(), followerID, followingID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to unfollow user", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Successfully unfollowed user", nil)
}

// FollowStatus handles GET /api/b2c/users/:id/follow-status
func (h *UserFollowHandler) FollowStatus(c *fiber.Ctx) error {
	followerIDVal := c.Locals("userID")
	followerID, ok := followerIDVal.(int64)
	if !ok || followerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	followingID, err := h.parseTargetID(c)
	if err != nil || followingID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid target user id", err)
	}

	isFollowing, err := h.followUsecase.IsFollowing(c.UserContext(), followerID, followingID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to check follow status", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Follow status retrieved", fiber.Map{
		"is_following": isFollowing,
	})
}
