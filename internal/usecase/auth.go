package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"njara-platform/internal/domain"
)

type authUsecase struct {
	userRepo       domain.UserRepository
	clubRepo       domain.ClubRepository
	cacheRepo      domain.CacheRepository
	passwordHasher domain.PasswordHasher
	tokenProvider  domain.TokenProvider
	cacheTTL       time.Duration
	tmRepo         domain.TransferMarketRepository // optional: auto-list players on register
}

// NewAuthUsecase creates a new instance of domain.AuthUsecase implementing business logic.
func NewAuthUsecase(
	userRepo domain.UserRepository,
	clubRepo domain.ClubRepository,
	cacheRepo domain.CacheRepository,
	passwordHasher domain.PasswordHasher,
	tokenProvider domain.TokenProvider,
	cacheTTL time.Duration,
	tmRepo domain.TransferMarketRepository,
) domain.AuthUsecase {
	return &authUsecase{
		userRepo:       userRepo,
		clubRepo:       clubRepo,
		cacheRepo:      cacheRepo,
		passwordHasher: passwordHasher,
		tokenProvider:  tokenProvider,
		cacheTTL:       cacheTTL,
		tmRepo:         tmRepo,
	}
}

func (u *authUsecase) Register(ctx context.Context, input domain.RegisterInput) (*domain.AuthResponse, error) {
	// Validate uniqueness of email & username
	existingUser, err := u.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing email: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("email already registered")
	}

	existingUsername, err := u.userRepo.GetByUsername(ctx, input.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to check existing username: %w", err)
	}
	if existingUsername != nil {
		return nil, errors.New("username already taken")
	}

	// Password hashing
	hashedPassword, err := u.passwordHasher.Hash(input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Fetch default Free Agent club
	freeAgentClub, err := u.clubRepo.GetByName(ctx, "Free Agent")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch Free Agent club: %w", err)
	}
	if freeAgentClub == nil {
		return nil, errors.New("default Free Agent club not found, database needs initialization")
	}

	// Language validation
	lang := input.Language
	if lang != "id" && lang != "en" {
		lang = "en" // Default to English
	}

	// Category validation (default to "player")
	cat := input.Category
	if cat != "player" && cat != "coach" && cat != "manager" && cat != "owner" && cat != "staff" && cat != "ba" && cat != "team_owner" {
		cat = "player"
	}

	// Contract logic: New users start at Free Agent, so contract and salary are always null
	var contractUntil *time.Time = nil
	var salary *int64 = nil

	// Create user
	user := &domain.User{
		Username:      input.Username,
		Email:         input.Email,
		PasswordHash:  hashedPassword,
		FullName:      input.FullName,
		Language:      lang,
		Bio:           input.Bio,
		ClubID:        freeAgentClub.ID,
		Category:      cat,
		ContractUntil: contractUntil,
		Salary:        salary,
	}

	if err := u.userRepo.Create(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Auto-list the new user in the transfer market (Free Agent by default)
	// ONLY if they are players or coaches who self-register (they start as Free Agent).
	// Managers, owners, staff, and BAs are never listed on the transfer market.
	// If a player/coach is added by a club (not self-registered), the club must
	// explicitly list them via the transfer market endpoint (UpdateStatusByUserID).
	if u.tmRepo != nil && (cat == "player" || cat == "coach") {
		tmEntry := &domain.TransferMarket{
			UserID: user.ID,
			Status: domain.TransferStatusFree,
		}
		if err := u.tmRepo.Create(ctx, tmEntry); err != nil {
			// Non-fatal: log the error but don't fail registration
			// The user was created successfully; transfer market can be reconciled later
			_ = fmt.Errorf("warning: failed to list user %d on transfer market: %w", user.ID, err)
		} else {
			// Invalidate transfer market cache
			_ = u.cacheRepo.DeletePrefix(ctx, "transfer_market:list:")

		}
	}

	// Generate JWT
	token, err := u.tokenProvider.GenerateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	refreshToken, err := u.tokenProvider.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &domain.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (u *authUsecase) Login(ctx context.Context, input domain.LoginInput) (*domain.AuthResponse, error) {
	user, err := u.userRepo.GetByEmail(ctx, input.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to find user: %w", err)
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// Compare passwords
	if err := u.passwordHasher.Compare(user.PasswordHash, input.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Generate JWT
	token, err := u.tokenProvider.GenerateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	refreshToken, err := u.tokenProvider.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &domain.AuthResponse{
		Token:        token,
		RefreshToken: refreshToken,
		User:         user,
	}, nil
}

func (u *authUsecase) RefreshToken(ctx context.Context, refreshTokenStr string) (*domain.AuthResponse, error) {
	// Validate refresh token
	userID, err := u.tokenProvider.ValidateRefreshToken(refreshTokenStr)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeUnauthorized, "invalid or expired refresh token", err)
	}

	// Make sure user still exists
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Generate new access token
	newAccessToken, err := u.tokenProvider.GenerateToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	// Generate new refresh token to implement refresh token rotation
	newRefreshToken, err := u.tokenProvider.GenerateRefreshToken(user.ID)
	if err != nil {
		return nil, fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return &domain.AuthResponse{
		Token:        newAccessToken,
		RefreshToken: newRefreshToken,
		User:         user,
	}, nil
}

func (u *authUsecase) GetProfile(ctx context.Context, userID int64) (*domain.User, error) {
	cacheKey := fmt.Sprintf("user:profile:%d", userID)

	// Cache-Aside pattern: Try to read from cache first
	cachedData, err := u.cacheRepo.Get(ctx, cacheKey)
	if err == nil && cachedData != nil {
		var user domain.User
		if err := json.Unmarshal(cachedData, &user); err == nil {
			return &user, nil
		}
	}

	// Cache miss: Read from Repository
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Write back to Cache
	if serialized, err := json.Marshal(user); err == nil {
		_ = u.cacheRepo.Set(ctx, cacheKey, serialized, u.cacheTTL)
	}

	return user, nil
}

func (u *authUsecase) InvalidateProfileCache(ctx context.Context, userID int64) error {
	return u.cacheRepo.Delete(ctx, fmt.Sprintf("user:profile:%d", userID))
}

func (u *authUsecase) GetProfileByUsername(ctx context.Context, username string) (*domain.User, error) {
	user, err := u.userRepo.GetByUsername(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by username: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Also load full profile (stats, achievements, etc.) via GetByID for consistent response
	return u.GetProfile(ctx, user.ID)
}


func (u *authUsecase) Logout(ctx context.Context, token string) error {
	cacheKey := "blocked_token:" + token
	// Refresh tokens are valid for 7 days, access tokens for less.
	// 7 days is a safe TTL for blocked tokens to prevent database buildup.
	return u.cacheRepo.Set(ctx, cacheKey, []byte("1"), 7*24*time.Hour)
}

func (u *authUsecase) IsTokenBlocked(ctx context.Context, token string) bool {
	cacheKey := "blocked_token:" + token
	data, err := u.cacheRepo.Get(ctx, cacheKey)
	return err == nil && data != nil
}

func (u *authUsecase) UpdateProfile(ctx context.Context, userID int64, input domain.UpdateProfileInput) (*domain.User, error) {
	// Language validation
	lang := input.Language
	if lang != "id" && lang != "en" {
		lang = "en"
	}

	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	user.FullName = input.FullName
	user.Bio = input.Bio
	user.Language = lang

	if err := u.userRepo.UpdateProfile(ctx, user); err != nil {
		return nil, fmt.Errorf("failed to update profile: %w", err)
	}

	// Invalidate profile cache
	cacheKey := fmt.Sprintf("user:profile:%d", userID)
	_ = u.cacheRepo.Delete(ctx, cacheKey)

	return user, nil
}

func (u *authUsecase) UpdateProfilePicture(ctx context.Context, userID int64, url string) error {
	err := u.userRepo.UpdateProfilePicture(ctx, userID, url)
	if err != nil {
		return fmt.Errorf("failed to update profile picture in repository: %w", err)
	}

	// Invalidate profile cache
	cacheKey := fmt.Sprintf("user:profile:%d", userID)
	_ = u.cacheRepo.Delete(ctx, cacheKey)

	return nil
}

func (u *authUsecase) ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return errors.New("user not found")
	}

	// Compare old password
	if err := u.passwordHasher.Compare(user.PasswordHash, oldPassword); err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "invalid old password", err)
	}

	// Hash new password
	hashedPassword, err := u.passwordHasher.Hash(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash new password: %w", err)
	}

	// Update password in repo
	if err := u.userRepo.UpdatePassword(ctx, userID, hashedPassword); err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}
