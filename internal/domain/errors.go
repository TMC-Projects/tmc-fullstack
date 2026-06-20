package domain

import "fmt"

// ErrorCode represents application specific error codes.
type ErrorCode string

const (
	ErrCodeValidation   ErrorCode = "VALIDATION_ERROR"
	ErrCodeUnauthorized ErrorCode = "UNAUTHORIZED"
	ErrCodeForbidden    ErrorCode = "FORBIDDEN"
	ErrCodeNotFound     ErrorCode = "NOT_FOUND"
	ErrCodeInternal     ErrorCode = "INTERNAL_ERROR"
	ErrCodeConflict     ErrorCode = "CONFLICT"
	ErrCodeBadRequest   ErrorCode = "BAD_REQUEST"
)

// AppError represents a domain error that can be safely returned to clients.
type AppError struct {
	Code    ErrorCode
	Message string
	Details interface{}
	Err     error // Underlying error for internal logging
}

// Error implements the standard error interface.
func (e *AppError) Error() string {
	if e.Err != nil {
		return fmt.Sprintf("%s: %v", e.Message, e.Err)
	}
	return e.Message
}

// Unwrap allows unwrapping the underlying error.
func (e *AppError) Unwrap() error {
	return e.Err
}

// NewAppError creates a new AppError.
func NewAppError(code ErrorCode, message string, err error) *AppError {
	return &AppError{
		Code:    code,
		Message: message,
		Err:     err,
	}
}

// WithDetails adds details to an AppError and returns it.
func (e *AppError) WithDetails(details interface{}) *AppError {
	e.Details = details
	return e
}
