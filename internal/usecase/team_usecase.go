package usecase

import (
	"context"
	"time"

	"njara-platform/internal/domain"
)

type teamUsecase struct {
	teamRepo domain.TeamRepository
	userRepo domain.UserRepository
}

func NewTeamUsecase(teamRepo domain.TeamRepository, userRepo domain.UserRepository) domain.TeamUsecase {
	return &teamUsecase{
		teamRepo: teamRepo,
		userRepo: userRepo,
	}
}

func (u *teamUsecase) CreateTeam(ctx context.Context, input *domain.Team, userID int64) (*domain.Team, error) {
	// Verify user belongs to the club
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	input.ClubID = user.ClubID
	if user.Category == "team_owner" {
		input.OwnerID = &user.ID
	}
	if input.Status == "" {
		input.Status = "active"
	}

	err = u.teamRepo.Create(ctx, input)
	if err != nil {
		return nil, err
	}

	return u.teamRepo.GetByID(ctx, input.ID)
}

func (u *teamUsecase) UpdateTeam(ctx context.Context, teamID int64, input *domain.Team, userID int64) (*domain.Team, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	team, err := u.teamRepo.GetByID(ctx, teamID)
	if err != nil {
		return nil, err
	}

	if user.Category == "team_owner" {
		if team.OwnerID == nil || *team.OwnerID != user.ID {
			return nil, domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	} else {
		if team.ClubID != user.ClubID {
			return nil, domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	}

	team.Name = input.Name
	team.Description = input.Description
	team.GameID = input.GameID
	if input.Status != "" {
		team.Status = input.Status
	}
	if input.LogoUrl != "" {
		team.LogoUrl = input.LogoUrl
	}

	err = u.teamRepo.Update(ctx, team)
	if err != nil {
		return nil, err
	}

	return u.teamRepo.GetByID(ctx, team.ID)
}

func (u *teamUsecase) GetTeamsByClubID(ctx context.Context, clubID int64, userID int64) ([]*domain.Team, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	// If team_owner, fetch by OwnerID
	if user.Category == "team_owner" {
		return u.teamRepo.GetByOwnerID(ctx, userID)
	}

	// For admin/manager, they can only view teams of their own club if we want strictly bound,
	// but generally get by clubID is fine if they ask for their own clubID.
	// We'll enforce they can only fetch their own club's teams
	if user.ClubID != clubID {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
	}

	return u.teamRepo.GetByClubID(ctx, clubID)
}

func (u *teamUsecase) GetTeamByID(ctx context.Context, teamID int64, userID int64) (*domain.Team, error) {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return nil, err
	}

	team, err := u.teamRepo.GetByID(ctx, teamID)
	if err != nil {
		return nil, err
	}

	if user.Category == "team_owner" {
		if team.OwnerID == nil || *team.OwnerID != user.ID {
			return nil, domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	} else {
		if team.ClubID != user.ClubID {
			return nil, domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	}

	return team, nil
}

func (u *teamUsecase) DeleteTeam(ctx context.Context, teamID int64, userID int64) error {
	user, err := u.userRepo.GetByID(ctx, userID)
	if err != nil {
		return err
	}

	team, err := u.teamRepo.GetByID(ctx, teamID)
	if err != nil {
		return err
	}

	if user.Category == "team_owner" {
		if team.OwnerID == nil || *team.OwnerID != user.ID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	} else {
		if team.ClubID != user.ClubID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	}

	return u.teamRepo.Delete(ctx, teamID)
}

func (u *teamUsecase) AssignUser(ctx context.Context, teamID int64, targetUserID int64, adminUserID int64) error {
	adminUser, err := u.userRepo.GetByID(ctx, adminUserID)
	if err != nil {
		return err
	}

	team, err := u.teamRepo.GetByID(ctx, teamID)
	if err != nil {
		return err
	}

	if adminUser.Category == "team_owner" {
		if team.OwnerID == nil || *team.OwnerID != adminUser.ID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	} else {
		if team.ClubID != adminUser.ClubID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	}

	targetUser, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}

	if adminUser.Category != "team_owner" && targetUser.ClubID != adminUser.ClubID {
		return domain.NewAppError(domain.ErrCodeForbidden, "User does not belong to your club", nil)
	}

	return u.userRepo.UpdateTeamID(ctx, targetUserID, &teamID)
}

func (u *teamUsecase) ReleaseUser(ctx context.Context, teamID int64, targetUserID int64, adminUserID int64) error {
	adminUser, err := u.userRepo.GetByID(ctx, adminUserID)
	if err != nil {
		return err
	}

	team, err := u.teamRepo.GetByID(ctx, teamID)
	if err != nil {
		return err
	}

	if adminUser.Category == "team_owner" {
		if team.OwnerID == nil || *team.OwnerID != adminUser.ID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	} else {
		if team.ClubID != adminUser.ClubID {
			return domain.NewAppError(domain.ErrCodeForbidden, "Not allowed to access team", nil)
		}
	}

	targetUser, err := u.userRepo.GetByID(ctx, targetUserID)
	if err != nil {
		return err
	}

	if targetUser.TeamID == nil || *targetUser.TeamID != teamID {
		return domain.NewAppError(domain.ErrCodeBadRequest, "User is not in this team", nil)
	}

	return u.userRepo.UpdateTeamID(ctx, targetUserID, nil)
}

func (u *teamUsecase) UploadLogo(ctx context.Context, teamID int64, url string, userID int64) error {
	// First, verify the user has access to this team
	team, err := u.GetTeamByID(ctx, teamID, userID)
	if err != nil {
		return err
	}

	// Update the logo URL
	team.LogoUrl = url
	team.UpdatedAt = time.Now()

	err = u.teamRepo.Update(ctx, team)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to update team logo", err)
	}

	return nil
}
