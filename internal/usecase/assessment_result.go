package usecase

import (
	"context"

	"njara-platform/internal/domain"
)

type assessmentResultUsecase struct {
	assessmentRepo  domain.AssessmentResultRepository
	participantRepo domain.TrialParticipantRepository
	trialRepo       domain.TrialRepository
	userRepo        domain.UserRepository
}

func NewAssessmentResultUsecase(
	assessmentRepo domain.AssessmentResultRepository,
	participantRepo domain.TrialParticipantRepository,
	trialRepo domain.TrialRepository,
	userRepo domain.UserRepository,
) domain.AssessmentResultUsecase {
	return &assessmentResultUsecase{
		assessmentRepo: assessmentRepo, participantRepo: participantRepo,
		trialRepo: trialRepo, userRepo: userRepo,
	}
}

func (u *assessmentResultUsecase) CreateAssessment(ctx context.Context, input domain.CreateAssessmentInput, callerUserID int64) (*domain.AssessmentResult, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isAssessor(caller.Category) {
		return nil, forbiddenErr("only coach or staff can submit an assessment")
	}

	validRecs := map[string]bool{
		domain.RecommendationHighlyRecommended: true,
		domain.RecommendationRecommended:       true,
		domain.RecommendationPotential:         true,
		domain.RecommendationNotRecommended:    true,
	}
	if !validRecs[input.Recommendation] {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid recommendation; allowed: HIGHLY_RECOMMENDED, RECOMMENDED, POTENTIAL, NOT_RECOMMENDED", nil)
	}

	participant, err := u.participantRepo.GetByID(ctx, input.ParticipantID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve participant", err)
	}
	if participant == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "participant not found", nil)
	}

	trial, err := u.trialRepo.GetByID(ctx, participant.TrialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil || trial.ClubID != caller.ClubID {
		return nil, forbiddenErr("you cannot assess a participant from another club's trial")
	}

	result := &domain.AssessmentResult{
		TrialID:        participant.TrialID,
		ParticipantID:  input.ParticipantID,
		AssessorID:     callerUserID,
		TotalScore:     0,
		Recommendation: input.Recommendation,
		Summary:        input.Summary,
	}
	if err := u.assessmentRepo.Create(ctx, result); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create assessment", err)
	}
	return result, nil
}

func (u *assessmentResultUsecase) GetAssessmentsByParticipant(ctx context.Context, participantID int64, callerUserID int64) ([]*domain.AssessmentResult, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !canViewParticipants(caller.Category) {
		return nil, forbiddenErr("insufficient permissions to view assessments")
	}

	participant, err := u.participantRepo.GetByID(ctx, participantID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve participant", err)
	}
	if participant == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "participant not found", nil)
	}

	trial, err := u.trialRepo.GetByID(ctx, participant.TrialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil || trial.ClubID != caller.ClubID {
		return nil, forbiddenErr("you cannot view assessments from another club's trial")
	}

	results, err := u.assessmentRepo.GetByParticipantID(ctx, participantID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve assessments", err)
	}
	return results, nil
}
