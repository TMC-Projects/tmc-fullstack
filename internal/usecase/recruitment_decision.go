package usecase

import (
	"context"

	"njara-platform/internal/domain"
)

type recruitmentDecisionUsecase struct {
	decisionRepo    domain.RecruitmentDecisionRepository
	participantRepo domain.TrialParticipantRepository
	trialRepo       domain.TrialRepository
	userRepo        domain.UserRepository
	appRepo         domain.TrialApplicationRepository
}

func NewRecruitmentDecisionUsecase(
	decisionRepo domain.RecruitmentDecisionRepository,
	participantRepo domain.TrialParticipantRepository,
	trialRepo domain.TrialRepository,
	userRepo domain.UserRepository,
	appRepo domain.TrialApplicationRepository,
) domain.RecruitmentDecisionUsecase {
	return &recruitmentDecisionUsecase{
		decisionRepo: decisionRepo, participantRepo: participantRepo,
		trialRepo: trialRepo, userRepo: userRepo, appRepo: appRepo,
	}
}

// CreateDecision creates a recruitment decision and updates the participant's FinalResult.
// Business rules:
//   - ACCEPTED → participant.FinalResult = PASSED
//   - REJECTED → participant.FinalResult = FAILED
//   - Only one active decision per participant (enforced by unique DB constraint)
func (u *recruitmentDecisionUsecase) CreateDecision(ctx context.Context, input domain.CreateDecisionInput, callerUserID int64) (*domain.RecruitmentDecision, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isDecisionMaker(caller.Category) {
		return nil, forbiddenErr("only owner or manager can make a recruitment decision")
	}

	validDecisions := map[string]bool{
		domain.DecisionAccepted:    true,
		domain.DecisionRejected:    true,
		domain.DecisionWaitingList: true,
	}
	if !validDecisions[input.Decision] {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid decision; allowed: ACCEPTED, REJECTED, WAITING_LIST", nil)
	}

	participant, err := u.participantRepo.GetByID(ctx, input.ParticipantID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve participant", err)
	}
	if participant == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "participant not found", nil)
	}

	trial, err := u.trialRepo.GetByID(ctx, input.TrialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != caller.ClubID {
		return nil, forbiddenErr("you cannot make decisions for another club's trial")
	}
	if participant.TrialID != input.TrialID {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, "participant does not belong to this trial", nil)
	}

	// Check for existing decision (unique constraint enforces this at DB level too)
	existing, err := u.decisionRepo.GetByParticipantID(ctx, input.ParticipantID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check existing decision", err)
	}
	if existing != nil {
		return nil, domain.NewAppError(domain.ErrCodeConflict, "a recruitment decision already exists for this participant", nil)
	}

	decision := &domain.RecruitmentDecision{
		TrialID:       input.TrialID,
		ParticipantID: input.ParticipantID,
		DecisionBy:    callerUserID,
		Decision:      input.Decision,
		Remarks:       input.Remarks,
	}
	if err := u.decisionRepo.Create(ctx, decision); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create recruitment decision", err)
	}

	// Side effect: update participant FinalResult and player's ClubID
	switch input.Decision {
	case domain.DecisionAccepted:
		participant.FinalResult = domain.FinalResultPassed
		// Assign the player to the club
		if err := u.userRepo.UpdateClubID(ctx, participant.PlayerID, trial.ClubID); err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to assign player to club", err)
		}
		// Update application status to SIGNED
		app, err := u.appRepo.GetByID(ctx, participant.ApplicationID)
		if err == nil && app != nil {
			app.Status = domain.ApplicationStatusSigned
			_ = u.appRepo.Update(ctx, app)
		}
	case domain.DecisionRejected:
		participant.FinalResult = domain.FinalResultFailed
	}
	if input.Decision != domain.DecisionWaitingList {
		if err := u.participantRepo.Update(ctx, participant); err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update participant final result", err)
		}
	}

	return decision, nil
}

// GetDecisionsByTrial returns all recruitment decisions for a trial.
func (u *recruitmentDecisionUsecase) GetDecisionsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*domain.RecruitmentDecision, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isDecisionMaker(caller.Category) {
		return nil, forbiddenErr("only owner or manager can view recruitment decisions")
	}

	trial, err := u.trialRepo.GetByID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != caller.ClubID {
		return nil, forbiddenErr("you cannot view decisions from another club's trial")
	}

	decisions, err := u.decisionRepo.GetByTrialID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve decisions", err)
	}
	return decisions, nil
}
