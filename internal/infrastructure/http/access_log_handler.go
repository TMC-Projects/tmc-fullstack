package http

import (
	"strconv"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

type AccessLogHandler struct {
	usecase domain.AccessLogUsecase
}

func NewAccessLogHandler(usecase domain.AccessLogUsecase) *AccessLogHandler {
	return &AccessLogHandler{usecase: usecase}
}

// GetList handles retrieving paginated access logs
func (h *AccessLogHandler) GetList(c *fiber.Ctx) error {
	page, _ := strconv.Atoi(c.Query("page", "1"))
	limit, _ := strconv.Atoi(c.Query("limit", "10"))

	filter := domain.AccessLogFilter{
		Page:  page,
		Limit: limit,
	}

	result, err := h.usecase.GetList(c.Context(), filter)
	if err != nil {
		return err // handled by global error handler
	}

	return SendSuccess(c, fiber.StatusOK, "Access logs retrieved successfully", result)
}
