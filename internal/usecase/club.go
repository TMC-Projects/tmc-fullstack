package usecase

import (
	"context"
	"fmt"
	"njara-platform/internal/domain"
)

type clubUsecase struct {
	clubRepo     domain.ClubRepository
	userRepo     domain.UserRepository
	rolePermRepo domain.RolePermissionRepository
	cacheRepo    domain.CacheRepository
}

func NewClubUsecase(clubRepo domain.ClubRepository, userRepo domain.UserRepository, rolePermRepo domain.RolePermissionRepository, cacheRepo domain.CacheRepository) domain.ClubUsecase {
	return &clubUsecase{
		clubRepo:     clubRepo,
		userRepo:     userRepo,
		rolePermRepo: rolePermRepo,
		cacheRepo:    cacheRepo,
	}
}

func (u *clubUsecase) CreateClub(ctx context.Context, club *domain.Club, userID int64) (*domain.Club, error) {
	// Verify user is an owner
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to verify user", err)
	}
	if user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", nil)
	}
	if user.Category != "owner" {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "only owner can create a club", nil)
	}

	// Create club
	err = u.clubRepo.Create(ctx, club)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create club", err)
	}

	// Assign owner to the club
	err = u.userRepo.UpdateClubID(ctx, userID, club.ID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to assign owner to club", err)
	}

	// Invalidate user cache so their profile returns the new ClubID
	cacheKey := fmt.Sprintf("user:profile:%d", userID)
	_ = u.cacheRepo.Delete(ctx, cacheKey)

	return club, nil
}

func (u *clubUsecase) UpdateClub(ctx context.Context, clubID int64, input *domain.Club, userID int64) (*domain.Club, error) {
	// Verify user permissions (manage_club)
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return nil, domain.NewAppError(domain.ErrCodeUnauthorized, "user not found", err)
	}

	// Ensure the user actually belongs to this club
	if user.ClubID != clubID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "user does not belong to this club", nil)
	}

	permissions, err := u.rolePermRepo.GetPermissionsByCategory(ctx, user.Category)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check permissions", err)
	}

	hasPerm := false
	for _, p := range permissions {
		if p == "manage_club" {
			hasPerm = true
			break
		}
	}
	if !hasPerm {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "insufficient permissions to manage club", nil)
	}

	club, err := u.clubRepo.GetByID(ctx, clubID)
	if err != nil || club == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "club not found", err)
	}

	// Apply updates
	club.Name = input.Name
	club.Address = input.Address
	club.Country = input.Country
	club.EstablishedYear = input.EstablishedYear
	club.OrganizationName = input.OrganizationName
	club.NIB = input.NIB
	club.NPWP = input.NPWP

	err = u.clubRepo.Update(ctx, club)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update club", err)
	}

	return club, nil
}

func (u *clubUsecase) GetAllClubs(ctx context.Context) ([]*domain.Club, error) {
	return u.clubRepo.GetAll(ctx)
}

func (u *clubUsecase) GetClubByID(ctx context.Context, id int64) (*domain.Club, error) {
	club, err := u.clubRepo.GetByID(ctx, id)
	if err != nil || club == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "club not found", err)
	}
	return club, nil
}

func (u *clubUsecase) UploadLogo(ctx context.Context, clubID int64, url string) error {
	club, err := u.clubRepo.GetByID(ctx, clubID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to get club", err)
	}
	if club == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "club not found", nil)
	}

	club.LogoUrl = url
	if err := u.clubRepo.Update(ctx, club); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to update club logo", err)
	}

	return nil
}

// ─── Achievements ────────────────────────────────────────────────────────────

func (u *clubUsecase) checkClubManagePermission(ctx context.Context, clubID, userID int64) error {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil || user == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "user not found", err)
	}
	if user.ClubID != clubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "user does not belong to this club", nil)
	}
	permissions, err := u.rolePermRepo.GetPermissionsByCategory(ctx, user.Category)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to check permissions", err)
	}
	hasPerm := false
	for _, p := range permissions {
		if p == "manage_club" {
			hasPerm = true
			break
		}
	}
	if !hasPerm {
		return domain.NewAppError(domain.ErrCodeForbidden, "insufficient permissions to manage club", nil)
	}
	return nil
}

func (u *clubUsecase) AddAchievement(ctx context.Context, clubID int64, input domain.ClubAchievement, userID int64) (*domain.ClubAchievement, error) {
	if err := u.checkClubManagePermission(ctx, clubID, userID); err != nil {
		return nil, err
	}
	
	input.ClubID = clubID
	if err := u.clubRepo.CreateAchievement(ctx, &input); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to add achievement", err)
	}
	return &input, nil
}

func (u *clubUsecase) UpdateAchievement(ctx context.Context, clubID int64, achID int64, input domain.ClubAchievement, userID int64) (*domain.ClubAchievement, error) {
	if err := u.checkClubManagePermission(ctx, clubID, userID); err != nil {
		return nil, err
	}
	
	existing, err := u.clubRepo.GetAchievementByID(ctx, achID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to get achievement", err)
	}
	if existing == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "achievement not found", nil)
	}
	if existing.ClubID != clubID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "achievement does not belong to this club", nil)
	}

	existing.Title = input.Title
	existing.Description = input.Description
	existing.Date = input.Date

	if err := u.clubRepo.UpdateAchievement(ctx, existing); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update achievement", err)
	}
	return existing, nil
}

func (u *clubUsecase) DeleteAchievement(ctx context.Context, clubID int64, achID int64, userID int64) error {
	if err := u.checkClubManagePermission(ctx, clubID, userID); err != nil {
		return err
	}

	existing, err := u.clubRepo.GetAchievementByID(ctx, achID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to get achievement", err)
	}
	if existing == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "achievement not found", nil)
	}
	if existing.ClubID != clubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "achievement does not belong to this club", nil)
	}

	if err := u.clubRepo.DeleteAchievement(ctx, achID); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to delete achievement", err)
	}
	return nil
}
