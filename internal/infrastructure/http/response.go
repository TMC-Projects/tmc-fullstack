package http

import (
	"errors"
	"github.com/gofiber/fiber/v2"
	"github.com/rs/zerolog/log"
	"njara-platform/internal/domain"
)

// APIResponse represents the standard JSON response format for all API endpoints.
type APIResponse struct {
	RequestID string      `json:"request_id,omitempty"`
	Success   bool        `json:"success"`
	Message   string      `json:"message"`
	Data      interface{} `json:"data,omitempty"`
	Error     *APIError   `json:"error,omitempty"`
}

// APIError represents the error structure inside the standard response.
type APIError struct {
	Code    string      `json:"code"`
	Message string      `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// SendSuccess is a helper to format a successful JSON response.
func SendSuccess(c *fiber.Ctx, statusCode int, message string, data interface{}) error {
	reqID := ""
	if id, ok := c.Locals("requestid").(string); ok {
		reqID = id
	}

	return c.Status(statusCode).JSON(APIResponse{
		RequestID: reqID,
		Success:   true,
		Message:   message,
		Data:      data,
	})
}

// GlobalErrorHandler handles any errors that bubble up to Fiber and formats them as standard JSON.
func GlobalErrorHandler(c *fiber.Ctx, err error) error {
	var appErr *domain.AppError
	var fiberErr *fiber.Error

	// Default internal server error
	code := fiber.StatusInternalServerError
	apiErr := &APIError{
		Code:    string(domain.ErrCodeInternal),
		Message: "Internal Server Error",
	}

	if errors.As(err, &appErr) {
		// Map domain error to HTTP status
		switch appErr.Code {
		case domain.ErrCodeValidation, domain.ErrCodeBadRequest:
			code = fiber.StatusBadRequest
		case domain.ErrCodeUnauthorized:
			code = fiber.StatusUnauthorized
		case domain.ErrCodeForbidden:
			code = fiber.StatusForbidden
		case domain.ErrCodeNotFound:
			code = fiber.StatusNotFound
		case domain.ErrCodeConflict:
			code = fiber.StatusConflict
		default:
			code = fiber.StatusInternalServerError
		}
		
		apiErr.Code = string(appErr.Code)
		apiErr.Message = appErr.Message
		apiErr.Details = appErr.Details

		if code == fiber.StatusInternalServerError {
			log.Error().Err(appErr.Err).Msg(appErr.Message)
		} else {
			// Log minor errors as info or warning for tracking
			log.Info().Err(appErr.Err).Msg(appErr.Message)
		}

	} else if errors.As(err, &fiberErr) {
		// Handle generic fiber errors like 404 Route Not Found or 405 Method Not Allowed
		code = fiberErr.Code
		apiErr.Code = "FIBER_ERROR"
		apiErr.Message = fiberErr.Message
	} else {
		// Unknown error
		log.Error().Err(err).Msg("Unhandled exception caught by global handler")
		apiErr.Message = err.Error() // Expose error message for now, can be restricted in prod
	}

	reqID := ""
	if id, ok := c.Locals("requestid").(string); ok {
		reqID = id
	}

	return c.Status(code).JSON(APIResponse{
		RequestID: reqID,
		Success:   false,
		Message:   apiErr.Message,
		Error:     apiErr,
	})
}
