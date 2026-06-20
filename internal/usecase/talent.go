package usecase

import (
	"context"
	"fmt"
	"math"
	"time"

	"golang.org/x/crypto/bcrypt"
	"njara-platform/internal/domain"
)

type talentUsecase struct {
	userRepo    domain.UserRepository
	authUsecase domain.AuthUsecase
	tmRepo      domain.TransferMarketRepository
	cacheRepo   domain.CacheRepository
}

// NewTalentUsecase creates a new instance of TalentUsecase.
func NewTalentUsecase(userRepo domain.UserRepository, authUsecase domain.AuthUsecase, tmRepo domain.TransferMarketRepository, cacheRepo domain.CacheRepository) domain.TalentUsecase {
	return &talentUsecase{
		userRepo:    userRepo,
		authUsecase: authUsecase,
		tmRepo:      tmRepo,
		cacheRepo:   cacheRepo,
	}
}

// RegisterTalent handles the logic of a manager registering a new user directly to their club.
func (u *talentUsecase) RegisterTalent(ctx context.Context, creatorUserID int64, input domain.RegisterTalentInput) (*domain.User, error) {
	// 1. Fetch the creator to determine their ClubID
	creator, err := u.authUsecase.GetProfile(ctx, creatorUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeUnauthorized, "failed to authenticate creator", err)
	}

	// 2. Validate email / username uniqueness
	existingEmail, _ := u.userRepo.GetByEmail(ctx, input.Email)
	if existingEmail != nil {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "email already in use", nil)
	}

	existingUser, _ := u.userRepo.GetByUsername(ctx, input.Username)
	if existingUser != nil {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "username already taken", nil)
	}

	// 3. Hash the provided password
	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to hash password", err)
	}

	// 4. Create the new user and assign them strictly to the creator's club
	newUser := &domain.User{
		Username:      input.Username,
		Email:         input.Email,
		PasswordHash:  string(hashedBytes),
		FullName:      input.FullName,
		Category:      input.Category,
		ClubID:        creator.ClubID,
		ContractUntil: input.ContractUntil,
		Salary:        input.Salary,
		Language:      "en",
		Bio:           "",
		ReleaseClauseEnable: input.ReleaseClauseEnable,
		ReleaseClauseAmount: input.ReleaseClauseAmount,
	}

	if err := u.userRepo.Create(ctx, newUser); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to register talent", err)
	}

	// Deliberately skipping Transfer Market registration logic here since they are hired directly

	return newUser, nil
}

// GetTalents returns a paginated, filtered, searchable list of talents.
// MarketValue is only visible when the caller is an owner or manager.
func (u *talentUsecase) GetTalents(ctx context.Context, filter domain.TalentFilter) (*domain.PaginatedTalents, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	// Determine if the caller is allowed to see market_value (owner or manager only)
	canSeeMarketValue := false
	if filter.CallerUserID > 0 {
		caller, err := u.authUsecase.GetProfile(ctx, filter.CallerUserID)
		if err == nil && caller != nil {
			canSeeMarketValue = caller.Category == "owner" || caller.Category == "manager"
			filter.CallerClubID = caller.ClubID
		}
	}

	results, total, err := u.userRepo.GetTalents(ctx, filter)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch talents", err)
	}

	// Redact market_value for non-privileged callers
	if !canSeeMarketValue {
		for _, t := range results {
			t.MarketValue = nil
		}
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &domain.PaginatedTalents{
		Data:       results,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}

// UpdateTalentBiodata updates the full_name, category, and bio of a talent.
// Only owner or manager from the same club can perform this action.
func (u *talentUsecase) UpdateTalentBiodata(ctx context.Context, targetUserID int64, input domain.UpdateTalentBiodataInput, callerUserID int64) error {
	// Verify caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can update talent biodata", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "talent not found", err)
	}

	// Check if caller and target are in the same club
	if caller.ClubID != target.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "cannot update biodata for talent outside your club", nil)
	}

	// Apply changes
	target.FullName = input.FullName
	target.Username = input.Username
	target.Email = input.Email
	target.Category = input.Category
	target.Bio = input.Bio

	return u.userRepo.UpdateProfile(ctx, target)
}

// UpdateMarketValue sets the market_value for a player or coach.
// Only owner or manager from the same club can perform this action.
func (u *talentUsecase) UpdateMarketValue(ctx context.Context, targetUserID int64, value *int64, callerUserID int64) error {
	// Verify caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can set market value", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// Only player and coach can have a market value
	if target.Category != "player" && target.Category != "coach" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "market value can only be set for player or coach", nil)
	}

	// Check if caller and target are in the same club
	if caller.ClubID != target.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "cannot set market value for talent outside your club", nil)
	}

	return u.userRepo.UpdateMarketValue(ctx, targetUserID, value)
}

// UpdateContractAndSalary updates the contract expiration and salary for a player or coach.
// Only owner or manager from the same club can perform this action.
func (u *talentUsecase) UpdateContractAndSalary(ctx context.Context, targetUserID int64, contractUntil *time.Time, salary *int64, callerUserID int64) error {
	// Verify caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can update contract and salary", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "user not found", err)
	}

	// Only player and coach can have contract and salary updated this way (in this context)
	if target.Category != "player" && target.Category != "coach" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "contract and salary can only be set for player or coach", nil)
	}

	// Check if caller and target are in the same club
	if caller.ClubID != target.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "cannot update contract for talent outside your club", nil)
	}

	return u.userRepo.UpdateContractAndSalary(ctx, targetUserID, contractUntil, salary)
}

// UpdateProfilePicture updates the profile picture of a talent.
// Only owner or manager from the same club can perform this action.
func (u *talentUsecase) UpdateProfilePicture(ctx context.Context, targetUserID int64, url string, callerUserID int64) error {
	// Verify caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can update talent profile picture", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "talent not found", err)
	}

	// Check if caller and target are in the same club
	if caller.ClubID != target.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "cannot update profile picture for talent outside your club", nil)
	}

	return u.userRepo.UpdateProfilePicture(ctx, targetUserID, url)
}

// UpdateStatus updates the account status (active/inactive) of a talent.
// Only owner or manager from the same club can perform this action.
func (u *talentUsecase) UpdateStatus(ctx context.Context, targetUserID int64, status string, callerUserID int64) error {
	// Verify caller privileges
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil || caller == nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", err)
	}
	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can update talent status", nil)
	}

	// Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "talent not found", err)
	}

	// Check if caller and target are in the same club
	if caller.ClubID != target.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "cannot update status for talent outside your club", nil)
	}

	if status != "active" && status != "inactive" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid status", nil)
	}

	return u.userRepo.UpdateStatus(ctx, targetUserID, status)
}

// SignFreeAgent assigns a free agent player to the caller's club.
func (u *talentUsecase) SignFreeAgent(ctx context.Context, targetUserID int64, callerUserID int64) error {
	// 1. Get caller profile
	caller, err := u.authUsecase.GetProfile(ctx, callerUserID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "failed to authenticate caller", err)
	}

	if caller.Category != "owner" && caller.Category != "manager" {
		return domain.NewAppError(domain.ErrCodeForbidden, "only owner or manager can sign players", nil)
	}

	if caller.ClubID == 0 {
		return domain.NewAppError(domain.ErrCodeForbidden, "caller does not belong to a club", nil)
	}

	// 2. Fetch target user
	target, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil || target == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "talent not found", err)
	}

	// 3. Verify target is a player or coach
	if target.Category != "player" && target.Category != "coach" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "only players and coaches can be signed", nil)
	}

	// Verify target is a free agent (ClubID is 0 or club name is 'Free Agent')
	isFreeAgent := target.ClubID == 0 || (target.Club != nil && target.Club.Name == "Free Agent")
	if !isFreeAgent {
		return domain.NewAppError(domain.ErrCodeBadRequest, "talent is not a free agent", nil)
	}

	// 4. Update the talent's club_id
	if err := u.userRepo.UpdateClubID(ctx, targetUserID, caller.ClubID); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to update talent club", err)
	}

	// 5. Delete from transfer market
	if err := u.tmRepo.DeleteByUserID(ctx, targetUserID); err != nil {
		// Log or ignore error, or return. Usually we return error or log it.
		// For consistency we will return error to ensure atomic behavior.
		return domain.NewAppError(domain.ErrCodeInternal, "failed to remove from transfer market", err)
	}

	// 6. Invalidate transfer market cache and user profile cache
	_ = u.cacheRepo.DeletePrefix(ctx, "transfer_market:list:")
	_ = u.cacheRepo.Delete(ctx, fmt.Sprintf("user:profile:%d", targetUserID))

	return nil
}
