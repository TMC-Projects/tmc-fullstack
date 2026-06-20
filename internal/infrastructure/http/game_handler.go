package http

import (
	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// GameHandler coordinates presentation logic for games.
type GameHandler struct {
	gameUsecase domain.GameUsecase
}

// NewGameHandler creates a new GameHandler.
func NewGameHandler(gu domain.GameUsecase) *GameHandler {
	return &GameHandler{gameUsecase: gu}
}

type gameResponse struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

// GetList returns the list of all seeded games in JSON.
func (h *GameHandler) GetList(c *fiber.Ctx) error {
	games, err := h.gameUsecase.GetList(c.UserContext())
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, err.Error(), err)
	}

	res := make([]gameResponse, len(games))
	for i, g := range games {
		res[i] = gameResponse{
			ID:   g.ID,
			Name: g.Name,
		}
	}

	return SendSuccess(c, fiber.StatusOK, "Games retrieved successfully", res)
}
