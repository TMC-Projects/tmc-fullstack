package http

import (
	"strconv"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PlayerVoteHandler struct {
	voteUsecase domain.PlayerVoteUsecase
}

func NewPlayerVoteHandler(voteUsecase domain.PlayerVoteUsecase) *PlayerVoteHandler {
	return &PlayerVoteHandler{voteUsecase: voteUsecase}
}

func (h *PlayerVoteHandler) HandleVote(c *fiber.Ctx) error {
	playerIDStr := c.Params("id")
	playerID, err := strconv.ParseInt(playerIDStr, 10, 64)
	if err != nil {
		return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid player ID"})
	}

	// 1. Get or Generate Device ID (Cookie)
	deviceID := c.Cookies("device_id")
	if deviceID == "" {
		deviceID = uuid.New().String()
		c.Cookie(&fiber.Cookie{
			Name:     "device_id",
			Value:    deviceID,
			Path:     "/",
			MaxAge:   365 * 24 * 60 * 60, // 1 year
			HTTPOnly: true,
			SameSite: "Lax",
		})
	}

	// 2. Get IP Address
	ipAddress := c.IP()

	// 3. Process Vote
	ctx := c.Context()
	if err := h.voteUsecase.Vote(ctx, playerID, deviceID, ipAddress); err != nil {
		if err.Error() == "already voted from this IP today" || err.Error() == "already voted from this device today" {
			return c.Status(fiber.StatusConflict).JSON(fiber.Map{"error": err.Error()})
		}

		return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": err.Error()})
	}

	// 4. Success Response
	return c.Status(fiber.StatusOK).JSON(fiber.Map{"message": "Vote cast successfully"})
}
