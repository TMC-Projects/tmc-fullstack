package http

import (
	"context"
	"fmt"
	"strings"
	"time"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

// AuthMiddleware handles request authentication and RBAC checks.
type AuthMiddleware struct {
	tokenProvider domain.TokenProvider
	authUsecase   domain.AuthUsecase
	rolePermRepo  domain.RolePermissionRepository
	clubRepo      domain.ClubRepository
	globalAPIKey  string
	accessLogRepo domain.AccessLogRepository
}

// NewAuthMiddleware creates a new AuthMiddleware instance.
func NewAuthMiddleware(
	tokenProvider domain.TokenProvider,
	authUsecase domain.AuthUsecase,
	rolePermRepo domain.RolePermissionRepository,
	clubRepo domain.ClubRepository,
	globalAPIKey string,
	accessLogRepo domain.AccessLogRepository,
) *AuthMiddleware {
	return &AuthMiddleware{
		tokenProvider: tokenProvider,
		authUsecase:   authUsecase,
		rolePermRepo:  rolePermRepo,
		clubRepo:      clubRepo,
		globalAPIKey:  globalAPIKey,
		accessLogRepo: accessLogRepo,
	}
}

// Authenticate is a GoFiber middleware to validate JWT tokens.
func (m *AuthMiddleware) Authenticate(c *fiber.Ctx) error {
	var tokenString string
	authHeader := c.Get("Authorization")

	if authHeader != "" {
		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid authorization header format", nil)
		}
		tokenString = parts[1]
	} else {
		tokenString = c.Query("token")
		if tokenString == "" {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "missing authorization header or token query", nil)
		}
	}

	if m.authUsecase.IsTokenBlocked(c.UserContext(), tokenString) {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "token has been revoked", nil)
	}

	userID, err := m.tokenProvider.ValidateToken(tokenString)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, fmt.Sprintf("invalid or expired token: %s", err.Error()), err)
	}

	user, err := m.authUsecase.GetProfile(c.UserContext(), userID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "user not found", err)
	}

	if user.Blocked {
		return domain.NewAppError(domain.ErrCodeForbidden, "your account has been blocked", nil)
	}

	c.Locals("userID", userID)
	c.Locals("user", user)
	return c.Next()
}

// RequireCategory restricts access to users belonging to specific user categories directly.
func (m *AuthMiddleware) RequireCategory(allowedCategories ...string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("userID")
		userID, ok := userIDVal.(int64)
		if !ok {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
		}

		user, err := m.authUsecase.GetProfile(c.UserContext(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized or user not found", err)
		}

		allowed := false
		for _, cat := range allowedCategories {
			if user.Category == cat {
				allowed = true
				break
			}
		}

		if !allowed {
			return domain.NewAppError(domain.ErrCodeForbidden, "forbidden: insufficient category permissions", nil)
		}

		return c.Next()
	}
}

// RequirePermission restricts access to users who possess a specific permission mapped in the database.
func (m *AuthMiddleware) RequirePermission(requiredPermission string) fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("userID")
		userID, ok := userIDVal.(int64)
		if !ok {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
		}

		user, err := m.authUsecase.GetProfile(c.UserContext(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized or user not found", err)
		}

		permissions, err := m.rolePermRepo.GetPermissionsByCategory(c.UserContext(), user.Category)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to verify role permissions", err)
		}

		hasPerm := false
		for _, perm := range permissions {
			if perm == requiredPermission {
				hasPerm = true
				break
			}
		}

		if !hasPerm {
			return domain.NewAppError(domain.ErrCodeForbidden, fmt.Sprintf("forbidden: missing required permission '%s'", requiredPermission), nil)
		}

		return c.Next()
	}
}

// RequireActiveB2BClub enforces that the user's club has an active subscription for B2B APIs.
// Blocks access if the club status is "expired", or if a trial/full subscription has naturally expired.
// Also auto-updates the club status to "expired" in the DB when the paid period lapses.
func (m *AuthMiddleware) RequireActiveB2BClub() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("userID")
		userID, ok := userIDVal.(int64)
		if !ok {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
		}

		user, err := m.authUsecase.GetProfile(c.UserContext(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized or user not found", err)
		}

		club, err := m.clubRepo.GetByID(c.UserContext(), user.ClubID)
		if err != nil || club == nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve club info", err)
		}

		// Auto-expire clubs whose paid subscription period has naturally lapsed
		if (club.Status == "full" || club.Status == "trial") && club.ExpiredDate != nil && club.ExpiredDate.Before(time.Now()) {
			club.Status = "expired"
			_ = m.clubRepo.Update(c.UserContext(), club)
		}

		if club.Status == "expired" {
			return domain.NewAppError(domain.ErrCodeForbidden, "B2B access denied: club subscription has expired. Please renew your subscription to continue.", nil)
		}

		if club.Status == "trial" {
			// trial without an expiry date is still in grace period — allow access
			return c.Next()
		}

		return c.Next()
	}
}

// RequireVerifiedClub enforces that the user's club is verified.
func (m *AuthMiddleware) RequireVerifiedClub() fiber.Handler {
	return func(c *fiber.Ctx) error {
		userIDVal := c.Locals("userID")
		userID, ok := userIDVal.(int64)
		if !ok {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
		}

		user, err := m.authUsecase.GetProfile(c.UserContext(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized or user not found", err)
		}

		if user.ClubID == 0 {
			return domain.NewAppError(domain.ErrCodeForbidden, "access denied: user does not belong to a club", nil)
		}

		club, err := m.clubRepo.GetByID(c.UserContext(), user.ClubID)
		if err != nil || club == nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve club info", err)
		}

		if !club.Verify {
			return domain.NewAppError(domain.ErrCodeForbidden, "access denied: club is not verified", nil)
		}

		return c.Next()
	}
}

// RequireAPIKey validates the request against the configured global API Key.
// The key should be passed in the "X-API-Key" header.
func (m *AuthMiddleware) RequireAPIKey() fiber.Handler {
	return func(c *fiber.Ctx) error {
		key := c.Get("X-API-Key")
		if key == "" {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "missing API key", nil)
		}
		if key != m.globalAPIKey {
			return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid API key", nil)
		}
		return c.Next()
	}
}

// AccessLogMiddleware logs incoming requests asynchronously to the database.
func (m *AuthMiddleware) AccessLogMiddleware() fiber.Handler {
	return func(c *fiber.Ctx) error {
		start := time.Now()

		// Get request ID from response headers (injected by requestid middleware)
		reqID := c.Response().Header.Peek("X-Request-Id")

		// Process the request
		err := c.Next()

		// If accessLogRepo is not provided, just return
		if m.accessLogRepo == nil {
			return err
		}

		// Gather response information
		latency := time.Since(start).Milliseconds()
		status := c.Response().StatusCode()
		if err != nil {
			// Try to get status from error
			if e, ok := err.(*fiber.Error); ok {
				status = e.Code
			} else {
				status = fiber.StatusInternalServerError
			}
		}

		// Gather request information
		path := c.Path()
		method := c.Method()
		ip := c.IP()
		userAgent := c.Get("User-Agent")
		requestID := string(reqID)

		// Extract user details if authenticated
		var userID *int64
		var email string
		var userRole string

		userCtx := c.Locals("user")
		if user, ok := userCtx.(*domain.User); ok && user != nil {
			userID = &user.ID
			email = user.Email
			userRole = user.Category
		}

		// Asynchronously save to database
		go func() {
			// We use context.Background() because c.Context() gets cancelled when request finishes
			logEntry := &domain.AccessLog{
				RequestID: requestID,
				Method:    method,
				Path:      path,
				IP:        ip,
				Status:    status,
				Latency:   latency,
				UserAgent: userAgent,
				UserID:    userID,
				Email:     email,
				UserRole:  userRole,
				CreatedAt: time.Now(),
			}
			// Best effort logging
			_ = m.accessLogRepo.Create(context.Background(), logEntry)
		}()

		return err
	}
}
