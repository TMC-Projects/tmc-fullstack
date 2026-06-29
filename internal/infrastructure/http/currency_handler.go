package http

import (
	"strings"

	"njara-platform/internal/domain"
	"njara-platform/internal/usecase"

	"github.com/gofiber/fiber/v2"
)

type CurrencyHandler struct {
	usecase *usecase.CurrencyUsecase
}

func NewCurrencyHandler(u *usecase.CurrencyUsecase) *CurrencyHandler {
	return &CurrencyHandler{
		usecase: u,
	}
}

func (h *CurrencyHandler) GetExchangeRate(c *fiber.Ctx) error {
	from := c.Query("from", "USD")
	to := c.Query("to", "IDR")

	from = strings.ToUpper(from)
	to = strings.ToUpper(to)

	rate, err := h.usecase.GetExchangeRate(from, to)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "Exchange rate not found or not yet available", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Exchange rate fetched successfully", rate)
}
