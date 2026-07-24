package http

import (
	"njara-platform/internal/config"
	"njara-platform/internal/domain"
	"njara-platform/internal/usecase"

	"github.com/gofiber/fiber/v2"
)

type InternalHandler struct {
	internalUsecase usecase.InternalUsecase
	tokenProvider   domain.TokenProvider
	config          config.Config
}

func NewInternalHandler(uc usecase.InternalUsecase, tp domain.TokenProvider, cfg config.Config) *InternalHandler {
	return &InternalHandler{
		internalUsecase: uc,
		tokenProvider:   tp,
		config:          cfg,
	}
}

func (h *InternalHandler) Login(c *fiber.Ctx) error {
	var req struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Username != h.config.InternalPortalUser || req.Password != h.config.InternalPortalPassword {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid credentials", nil)
	}

	// Generate token with a special internal admin marker
	// For simplicity, we just use the existing TokenProvider and use ID = 0 to signify internal admin.
	token, err := h.tokenProvider.GenerateToken(0)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to generate token", err)
	}

	return c.JSON(fiber.Map{
		"success": true,
		"data": fiber.Map{
			"token": token,
		},
	})
}

func (h *InternalHandler) GetTables(c *fiber.Ctx) error {
	tables, err := h.internalUsecase.GetTables(c.Context())
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    tables,
	})
}

func (h *InternalHandler) GetTableData(c *fiber.Ctx) error {
	tableName := c.Params("tableName")
	data, err := h.internalUsecase.GetTableData(c.Context(), tableName)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

func (h *InternalHandler) GetTableDataByID(c *fiber.Ctx) error {
	tableName := c.Params("tableName")
	id := c.Params("id")
	data, err := h.internalUsecase.GetTableDataByID(c.Context(), tableName, id)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"data":    data,
	})
}

func (h *InternalHandler) CreateTableData(c *fiber.Ctx) error {
	tableName := c.Params("tableName")
	var data map[string]interface{}
	if err := c.BodyParser(&data); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}
	if err := h.internalUsecase.CreateTableData(c.Context(), tableName, data); err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "data created successfully",
	})
}

func (h *InternalHandler) UpdateTableData(c *fiber.Ctx) error {
	tableName := c.Params("tableName")
	id := c.Params("id")
	var data map[string]interface{}
	if err := c.BodyParser(&data); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}
	if err := h.internalUsecase.UpdateTableData(c.Context(), tableName, id, data); err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "data updated successfully",
	})
}

func (h *InternalHandler) DeleteTableData(c *fiber.Ctx) error {
	tableName := c.Params("tableName")
	id := c.Params("id")
	if err := h.internalUsecase.DeleteTableData(c.Context(), tableName, id); err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"message": "data deleted successfully",
	})
}

// InternalAuthMiddleware verifies the token specifically for internal portal access.
// Since ID 0 is used for internal portal, we can check that.
func InternalAuthMiddleware(tp domain.TokenProvider) fiber.Handler {
	return func(c *fiber.Ctx) error {
		tokenString := c.Get("Authorization")
		if tokenString == "" {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "missing authorization header", nil)
		}

		// Remove 'Bearer ' prefix if present
		if len(tokenString) > 7 && tokenString[:7] == "Bearer " {
			tokenString = tokenString[7:]
		}

		userID, err := tp.ValidateToken(tokenString)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid token", err)
		}

		if userID != 0 {
			return domain.NewAppError(domain.ErrCodeForbidden, "not authorized for internal portal", nil)
		}

		c.Locals("internal_admin", true)
		return c.Next()
	}
}

func (h *InternalHandler) ResetUserPassword(c *fiber.Ctx) error {
	userID := c.Params("id")
	newPassword, err := h.internalUsecase.ResetUserPassword(c.Context(), userID)
	if err != nil {
		return err
	}
	return c.JSON(fiber.Map{
		"success": true,
		"password": newPassword,
		"message": "Password reset successfully",
	})
}
