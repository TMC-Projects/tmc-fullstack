package usecase

import (
	"context"

	"njara-platform/internal/domain"
)

type trialParticipantUsecase struct {
	participantRepo domain.TrialParticipantRepository
	trialRepo       domain.TrialRepository
	userRepo        domain.UserRepository
}

func NewTrialParticipantUsecase(
	participantRepo domain.TrialParticipantRepository,
	trialRepo domain.TrialRepository,
	userRepo domain.UserRepository,
) domain.TrialParticipantUsecase {
	return &trialParticipantUsecase{
		participantRepo: participantRepo,
		trialRepo:       trialRepo,
		userRepo:        userRepo,
	}
}

func (u *trialParticipantUsecase) GetParticipantsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*domain.TrialParticipant, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !canViewParticipants(caller.Category) {
		return nil, forbiddenErr("insufficient permissions to view participants")
	}

	trial, err := u.trialRepo.GetByID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != caller.ClubID {
		return nil, forbiddenErr("you cannot view participants from another club's trial")
	}

	participants, err := u.participantRepo.GetByTrialID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve participants", err)
	}
	return participants, nil
}

func (u *trialParticipantUsecase) UpdateAttendance(ctx context.Context, participantID int64, attendance string, callerUserID int64) (*domain.TrialParticipant, error) {
	validAttendance := map[string]bool{
		domain.AttendancePresent: true,
		domain.AttendanceAbsent:  true,
		domain.AttendanceNoShow:  true,
	}
	if !validAttendance[attendance] {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid attendance status; allowed: PRESENT, ABSENT, NO_SHOW", nil)
	}

	participant, caller, err := u.resolveParticipantAction(ctx, participantID, callerUserID)
	if err != nil {
		return nil, err
	}
	_ = caller

	participant.AttendanceStatus = attendance
	if err := u.participantRepo.Update(ctx, participant); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update attendance", err)
	}
	return participant, nil
}

func (u *trialParticipantUsecase) UpdateStage(ctx context.Context, participantID int64, stage string, callerUserID int64) (*domain.TrialParticipant, error) {
	validStages := map[string]bool{
		domain.StageRound1: true,
		domain.StageRound2: true,
		domain.StageFinal:  true,
	}
	if !validStages[stage] {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid stage; allowed: ROUND_1, ROUND_2, FINAL", nil)
	}

	participant, caller, err := u.resolveParticipantAction(ctx, participantID, callerUserID)
	if err != nil {
		return nil, err
	}
	_ = caller

	participant.CurrentStage = stage
	if err := u.participantRepo.Update(ctx, participant); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update stage", err)
	}
	return participant, nil
}

// resolveParticipantAction fetches participant and validates the caller's access.
func (u *trialParticipantUsecase) resolveParticipantAction(ctx context.Context, participantID int64, callerUserID int64) (*domain.TrialParticipant, *domain.User, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isTrialManager(caller.Category) {
		return nil, nil, forbiddenErr("only owner, manager, or staff can update participant info")
	}

	participant, err := u.participantRepo.GetByID(ctx, participantID)
	if err != nil {
		return nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve participant", err)
	}
	if participant == nil {
		return nil, nil, domain.NewAppError(domain.ErrCodeNotFound, "participant not found", nil)
	}

	trial, err := u.trialRepo.GetByID(ctx, participant.TrialID)
	if err != nil {
		return nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil || trial.ClubID != caller.ClubID {
		return nil, nil, forbiddenErr("you cannot update a participant from another club's trial")
	}

	return participant, caller, nil
}
