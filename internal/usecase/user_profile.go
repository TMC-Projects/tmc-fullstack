package usecase

import (
	"context"
	"fmt"

	"njara-platform/internal/domain"
)

type userProfileUsecase struct {
	repo      domain.UserProfileRepository
	cacheRepo domain.CacheRepository
}

func NewUserProfileUsecase(repo domain.UserProfileRepository, cacheRepo domain.CacheRepository) domain.UserProfileUsecase {
	return &userProfileUsecase{repo: repo, cacheRepo: cacheRepo}
}

func (u *userProfileUsecase) invalidateCache(ctx context.Context, userID int64) {
	cacheKey := fmt.Sprintf("user:profile:%d", userID)
	_ = u.cacheRepo.Delete(ctx, cacheKey)
}

// ─── Stats ───────────────────────────────────────────────────────────────────

func (u *userProfileUsecase) CreateStat(ctx context.Context, userID int64, input domain.UserStat) (*domain.UserStat, error) {
	input.UserID = userID
	if err := u.repo.CreateStat(ctx, &input); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create stat", err)
	}
	u.invalidateCache(ctx, userID)
	return &input, nil
}

func (u *userProfileUsecase) UpdateStat(ctx context.Context, userID, id int64, input domain.UserStat) (*domain.UserStat, error) {
	existing, err := u.repo.GetStatByID(ctx, id)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch stat", err)
	}
	if existing == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "stat not found", nil)
	}
	if existing.UserID != userID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "not your stat", nil)
	}

	existing.StatName = input.StatName
	existing.StatValue = input.StatValue
	if input.GameID != 0 {
		existing.GameID = input.GameID
	}

	if err := u.repo.UpdateStat(ctx, existing); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update stat", err)
	}
	u.invalidateCache(ctx, userID)
	return existing, nil
}

func (u *userProfileUsecase) DeleteStat(ctx context.Context, userID, id int64) error {
	existing, err := u.repo.GetStatByID(ctx, id)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch stat", err)
	}
	if existing == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "stat not found", nil)
	}
	if existing.UserID != userID {
		return domain.NewAppError(domain.ErrCodeForbidden, "not your stat", nil)
	}
	if err := u.repo.DeleteStat(ctx, id); err != nil {
		return err
	}
	u.invalidateCache(ctx, userID)
	return nil
}

// ─── Social Media ────────────────────────────────────────────────────────────

func (u *userProfileUsecase) CreateSocialMedia(ctx context.Context, userID int64, input domain.UserSocialMedia) (*domain.UserSocialMedia, error) {
	input.UserID = userID
	if err := u.repo.CreateSocialMedia(ctx, &input); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create social media", err)
	}
	u.invalidateCache(ctx, userID)
	return &input, nil
}

func (u *userProfileUsecase) UpdateSocialMedia(ctx context.Context, userID, id int64, input domain.UserSocialMedia) (*domain.UserSocialMedia, error) {
	existing, err := u.repo.GetSocialMediaByID(ctx, id)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch social media", err)
	}
	if existing == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "social media not found", nil)
	}
	if existing.UserID != userID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "not your social media", nil)
	}

	existing.Platform = input.Platform
	existing.Username = input.Username
	existing.URL = input.URL

	if err := u.repo.UpdateSocialMedia(ctx, existing); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update social media", err)
	}
	u.invalidateCache(ctx, userID)
	return existing, nil
}

func (u *userProfileUsecase) DeleteSocialMedia(ctx context.Context, userID, id int64) error {
	existing, err := u.repo.GetSocialMediaByID(ctx, id)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch social media", err)
	}
	if existing == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "social media not found", nil)
	}
	if existing.UserID != userID {
		return domain.NewAppError(domain.ErrCodeForbidden, "not your social media", nil)
	}
	if err := u.repo.DeleteSocialMedia(ctx, id); err != nil {
		return err
	}
	u.invalidateCache(ctx, userID)
	return nil
}

// ─── Achievements ────────────────────────────────────────────────────────────

func (u *userProfileUsecase) CreateAchievement(ctx context.Context, userID int64, input domain.UserAchievement) (*domain.UserAchievement, error) {
	input.UserID = userID
	if err := u.repo.CreateAchievement(ctx, &input); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create achievement", err)
	}
	u.invalidateCache(ctx, userID)
	return &input, nil
}

func (u *userProfileUsecase) UpdateAchievement(ctx context.Context, userID, id int64, input domain.UserAchievement) (*domain.UserAchievement, error) {
	existing, err := u.repo.GetAchievementByID(ctx, id)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch achievement", err)
	}
	if existing == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "achievement not found", nil)
	}
	if existing.UserID != userID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "not your achievement", nil)
	}

	existing.Title = input.Title
	existing.Description = input.Description
	existing.Year = input.Year
	existing.ImageURL = input.ImageURL

	if err := u.repo.UpdateAchievement(ctx, existing); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update achievement", err)
	}
	u.invalidateCache(ctx, userID)
	return existing, nil
}

func (u *userProfileUsecase) DeleteAchievement(ctx context.Context, userID, id int64) error {
	existing, err := u.repo.GetAchievementByID(ctx, id)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch achievement", err)
	}
	if existing == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "achievement not found", nil)
	}
	if existing.UserID != userID {
		return domain.NewAppError(domain.ErrCodeForbidden, "not your achievement", nil)
	}
	if err := u.repo.DeleteAchievement(ctx, id); err != nil {
		return err
	}
	u.invalidateCache(ctx, userID)
	return nil
}

// ─── Highlights ──────────────────────────────────────────────────────────────

func (u *userProfileUsecase) CreateHighlight(ctx context.Context, userID int64, input domain.UserHighlight) (*domain.UserHighlight, error) {
	input.UserID = userID
	if err := u.repo.CreateHighlight(ctx, &input); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create highlight", err)
	}
	u.invalidateCache(ctx, userID)
	return &input, nil
}

func (u *userProfileUsecase) UpdateHighlight(ctx context.Context, userID, id int64, input domain.UserHighlight) (*domain.UserHighlight, error) {
	existing, err := u.repo.GetHighlightByID(ctx, id)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch highlight", err)
	}
	if existing == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "highlight not found", nil)
	}
	if existing.UserID != userID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "not your highlight", nil)
	}

	existing.Title = input.Title
	existing.VideoURL = input.VideoURL

	if err := u.repo.UpdateHighlight(ctx, existing); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update highlight", err)
	}
	u.invalidateCache(ctx, userID)
	return existing, nil
}

func (u *userProfileUsecase) DeleteHighlight(ctx context.Context, userID, id int64) error {
	existing, err := u.repo.GetHighlightByID(ctx, id)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to fetch highlight", err)
	}
	if existing == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "highlight not found", nil)
	}
	if existing.UserID != userID {
		return domain.NewAppError(domain.ErrCodeForbidden, "not your highlight", nil)
	}
	if err := u.repo.DeleteHighlight(ctx, id); err != nil {
		return err
	}
	u.invalidateCache(ctx, userID)
	return nil
}
