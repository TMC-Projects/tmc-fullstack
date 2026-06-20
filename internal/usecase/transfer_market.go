package usecase

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"njara-platform/internal/domain"
)

// transferMarketCacheTTL is the cache duration for transfer market list results.
const transferMarketCacheTTL = 2 * time.Minute

type transferMarketUsecase struct {
	tmRepo      domain.TransferMarketRepository
	cacheRepo   domain.CacheRepository
	userRepo    domain.UserRepository
	authUsecase domain.AuthUsecase
}

// NewTransferMarketUsecase creates a new instance of domain.TransferMarketUsecase.
func NewTransferMarketUsecase(
	tmRepo domain.TransferMarketRepository,
	cacheRepo domain.CacheRepository,
	userRepo domain.UserRepository,
	authUsecase domain.AuthUsecase,
) domain.TransferMarketUsecase {
	return &transferMarketUsecase{
		tmRepo:      tmRepo,
		cacheRepo:   cacheRepo,
		userRepo:    userRepo,
		authUsecase: authUsecase,
	}
}

// GetList returns a filtered, paginated list of transfer market entries.
// Implements Cache-Aside pattern: Redis → DB → write back.
func (u *transferMarketUsecase) GetList(ctx context.Context, filter domain.TransferMarketFilter) ([]domain.TransferMarket, int64, error) {
	// Normalize defaults
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 {
		filter.Limit = 10
	}
	if filter.Limit > 50 {
		filter.Limit = 50
	}
	// Note: if filter.Status == "", repository will fetch all except "closed"

	// Determine if the caller is privileged to see financial data
	isPrivileged := false
	if filter.CallerUserID > 0 {
		caller, err := u.authUsecase.GetProfile(ctx, filter.CallerUserID)
		if err == nil && caller != nil && (caller.Category == domain.CategoryOwner || caller.Category == domain.CategoryManager) {
			isPrivileged = true
		}
	}

	cacheKey := fmt.Sprintf("transfer_market:list:%s:search:%s:%d:%d", filter.Status, filter.Search, filter.Page, filter.Limit)

	// Cache-Aside: try cache first
	type cachedResult struct {
		Entries []domain.TransferMarket `json:"entries"`
		Total   int64                   `json:"total"`
	}

	var entries []domain.TransferMarket
	var total int64
	fromCache := false

	if cached, err := u.cacheRepo.Get(ctx, cacheKey); err == nil && cached != nil {
		var cr cachedResult
		if err := json.Unmarshal(cached, &cr); err == nil {
			entries = cr.Entries
			total = cr.Total
			fromCache = true
		}
	}

	if !fromCache {
		// Cache miss: query database
		var err error
		entries, total, err = u.tmRepo.GetList(ctx, filter)
		if err != nil {
			return nil, 0, fmt.Errorf("failed to get transfer market list: %w", err)
		}

		// Write-back to cache (Unmasked)
		cr := cachedResult{Entries: entries, Total: total}
		if serialized, err := json.Marshal(cr); err == nil {
			_ = u.cacheRepo.Set(ctx, cacheKey, serialized, transferMarketCacheTTL)
		}
	}

	// Mask financial fields for non-privileged callers
	if !isPrivileged {
		for i := range entries {
			if entries[i].User != nil {
				entries[i].User.Salary = nil
				entries[i].User.MarketValue = nil
			}
		}
	}

	return entries, total, nil
}

// UpdateStatusByUserID updates or creates a transfer market entry for a specific user.
func (u *transferMarketUsecase) UpdateStatusByUserID(ctx context.Context, targetUserID int64, status string, callerUserID int64) error {
	// Validate caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != domain.CategoryOwner && caller.Category != domain.CategoryManager {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can update transfer status", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// Only player and coach can be on the transfer market
	if target.Category != "player" && target.Category != "coach" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "transfer market is only applicable for players and coaches", nil)
	}

	// Caller must belong to the same club as the target user
	if target.ClubID != caller.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "you can only update transfer status for users in your own club", nil)
	}

	// Check if transfer market entry exists
	existing, err := u.tmRepo.GetByUserID(ctx, targetUserID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to check transfer market status", err)
	}

	if existing != nil {
		// Update existing entry
		if err := u.tmRepo.UpdateStatus(ctx, existing.ID, status); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update transfer status", err)
		}
	} else {
		// Create new entry (Upsert behavior)
		newEntry := &domain.TransferMarket{
			UserID: targetUserID,
			Status: status,
		}
		if err := u.tmRepo.Create(ctx, newEntry); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to create transfer market entry", err)
		}
	}

	// Invalidate cache since list has changed
	_ = u.cacheRepo.DeletePrefix(ctx, "transfer_market:list:")

	return nil
}
