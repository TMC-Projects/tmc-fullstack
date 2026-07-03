package usecase

import (
	"context"
	"fmt"

	"njara-platform/internal/domain"
)

type teamInvitationUsecase struct {
	invRepo   domain.TeamInvitationRepository
	userRepo  domain.UserRepository
	tmRepo    domain.TransferMarketRepository
	cacheRepo domain.CacheRepository
}

func NewTeamInvitationUsecase(
	invRepo domain.TeamInvitationRepository,
	userRepo domain.UserRepository,
	tmRepo domain.TransferMarketRepository,
	cacheRepo domain.CacheRepository,
) domain.TeamInvitationUsecase {
	return &teamInvitationUsecase{
		invRepo:   invRepo,
		userRepo:  userRepo,
		tmRepo:    tmRepo,
		cacheRepo: cacheRepo,
	}
}

func (u *teamInvitationUsecase) GetMyInvitations(ctx context.Context, playerID int64) ([]domain.TeamInvitation, error) {
	return u.invRepo.GetByPlayerID(ctx, playerID)
}

func (u *teamInvitationUsecase) RespondInvitation(ctx context.Context, invitationID int64, playerID int64, accept bool) error {
	invitation, err := u.invRepo.GetByID(ctx, invitationID)
	if err != nil {
		return err
	}
	if invitation == nil {
		return domain.NewAppError(domain.ErrCodeNotFound, "invitation not found", nil)
	}

	if invitation.PlayerID != playerID {
		return domain.NewAppError(domain.ErrCodeForbidden, "not your invitation", nil)
	}

	if invitation.Status != "pending" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invitation is already processed", nil)
	}

	if !accept {
		// Just reject it
		return u.invRepo.UpdateStatus(ctx, invitationID, "rejected")
	}

	// Accepting
	err = u.invRepo.UpdateStatus(ctx, invitationID, "accepted")
	if err != nil {
		return err
	}

	// Update player club and team
	if err := u.userRepo.UpdateClubID(ctx, playerID, invitation.ClubID); err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to update club", err)
	}

	if invitation.TeamID != nil {
		if err := u.userRepo.UpdateTeamID(ctx, playerID, invitation.TeamID); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "failed to update team", err)
		}
	}

	// Remove from transfer market
	_ = u.tmRepo.DeleteByUserID(ctx, playerID)

	// Invalidate cache
	_ = u.cacheRepo.DeletePrefix(ctx, "transfer_market:list:")
	_ = u.cacheRepo.Delete(ctx, fmt.Sprintf("user:profile:%d", playerID))

	// Reject all other pending invitations for this player to prevent conflict
	_ = u.invRepo.RejectAllPendingForPlayer(ctx, playerID, invitationID)

	return nil
}
