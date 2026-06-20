package usecase

import (
	"context"
	"time"

	"njara-platform/internal/domain"
)

type trialUsecase struct {
	trialRepo domain.TrialRepository
	userRepo  domain.UserRepository
	clubRepo  domain.ClubRepository
}

func NewTrialUsecase(trialRepo domain.TrialRepository, userRepo domain.UserRepository, clubRepo domain.ClubRepository) domain.TrialUsecase {
	return &trialUsecase{trialRepo: trialRepo, userRepo: userRepo, clubRepo: clubRepo}
}

func (u *trialUsecase) CreateTrial(ctx context.Context, input domain.CreateTrialInput, callerUserID int64) (*domain.Trial, error) {
	user, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", nil)
	}
	if !isTrialManager(user.Category) {
		return nil, forbiddenErr("only owner, manager, or staff can create a trial")
	}
	if input.Title == "" {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "title is required", nil)
	}
	if input.GameID == 0 {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "game_id is required", nil)
	}
	if input.StartDate.IsZero() || input.EndDate.IsZero() {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "start_date and end_date are required", nil)
	}
	if !input.EndDate.After(input.StartDate) {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "end_date must be after start_date", nil)
	}

	trial := &domain.Trial{
		ClubID:          user.ClubID,
		GameID:          input.GameID,
		Title:           input.Title,
		Description:     input.Description,
		StartDate:       input.StartDate,
		EndDate:         input.EndDate,
		MaxParticipants: input.MaxParticipants,
		Status:          domain.TrialStatusDraft,
		CreatedBy:       callerUserID,
	}
	if err := u.trialRepo.Create(ctx, trial); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create trial", err)
	}
	return trial, nil
}

func (u *trialUsecase) UpdateTrial(ctx context.Context, trialID int64, input domain.UpdateTrialInput, callerUserID int64) (*domain.Trial, error) {
	user, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", nil)
	}
	if !isTrialManager(user.Category) {
		return nil, forbiddenErr("only owner, manager, or staff can update a trial")
	}

	trial, err := u.trialRepo.GetByID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != user.ClubID {
		return nil, forbiddenErr("you cannot modify a trial from another club")
	}

	validStatuses := map[string]bool{
		domain.TrialStatusDraft:     true,
		domain.TrialStatusPublished: true,
		domain.TrialStatusClosed:    true,
		domain.TrialStatusCompleted: true,
	}

	if input.Title != "" {
		trial.Title = input.Title
	}
	if input.Description != "" {
		trial.Description = input.Description
	}
	if input.GameID != 0 {
		trial.GameID = input.GameID
	}
	if !input.StartDate.IsZero() {
		trial.StartDate = input.StartDate
	}
	if !input.EndDate.IsZero() {
		trial.EndDate = input.EndDate
	}
	if input.MaxParticipants > 0 {
		trial.MaxParticipants = input.MaxParticipants
	}
	if input.Status != "" {
		if !validStatuses[input.Status] {
			return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid status; allowed: DRAFT, PUBLISHED, CLOSED, COMPLETED", nil)
		}
		trial.Status = input.Status
	}
	if !trial.EndDate.After(trial.StartDate) {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "end_date must be after start_date", nil)
	}

	trial.UpdatedAt = time.Now()
	if err := u.trialRepo.Update(ctx, trial); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update trial", err)
	}
	return trial, nil
}

func (u *trialUsecase) GetTrials(ctx context.Context, filter domain.TrialFilter) ([]*domain.Trial, int64, error) {
	trials, total, err := u.trialRepo.GetList(ctx, filter)
	if err != nil {
		return nil, 0, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trials", err)
	}
	return trials, total, nil
}

func (u *trialUsecase) GetTrialByID(ctx context.Context, id int64) (*domain.Trial, error) {
	trial, err := u.trialRepo.GetByID(ctx, id)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	return trial, nil
}
