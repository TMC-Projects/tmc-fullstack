package usecase

import (
	"context"

	"njara-platform/internal/domain"
)

type assessmentScoreUsecase struct {
	scoreRepo      domain.AssessmentScoreRepository
	assessmentRepo domain.AssessmentResultRepository
	criteriaRepo   domain.AssessmentCriteriaRepository
	userRepo       domain.UserRepository
}

func NewAssessmentScoreUsecase(
	scoreRepo domain.AssessmentScoreRepository,
	assessmentRepo domain.AssessmentResultRepository,
	criteriaRepo domain.AssessmentCriteriaRepository,
	userRepo domain.UserRepository,
) domain.AssessmentScoreUsecase {
	return &assessmentScoreUsecase{
		scoreRepo: scoreRepo, assessmentRepo: assessmentRepo,
		criteriaRepo: criteriaRepo, userRepo: userRepo,
	}
}

// AddScores saves scores for each criteria and recalculates the assessment TotalScore.
// Formula: total_score = Σ(score_i × weight_i)
func (u *assessmentScoreUsecase) AddScores(ctx context.Context, assessmentID int64, inputs []domain.ScoreInput, callerUserID int64) ([]*domain.AssessmentScore, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isAssessor(caller.Category) {
		return nil, forbiddenErr("only coach or staff can add assessment scores")
	}

	assessment, err := u.assessmentRepo.GetByID(ctx, assessmentID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve assessment", err)
	}
	if assessment == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "assessment not found", nil)
	}
	if assessment.AssessorID != callerUserID {
		return nil, forbiddenErr("you can only add scores to your own assessment")
	}
	if len(inputs) == 0 {
		return nil, domain.NewAppError(domain.ErrCodeValidation, "at least one score is required", nil)
	}

	// Validate scores and build score records
	criteriaWeights := map[int64]float64{}
	allCriteria, err := u.criteriaRepo.GetActive(ctx)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to load criteria", err)
	}
	for _, c := range allCriteria {
		criteriaWeights[c.ID] = c.Weight
	}

	scores := make([]*domain.AssessmentScore, 0, len(inputs))
	for _, inp := range inputs {
		if inp.Score < 1 || inp.Score > 100 {
			return nil, domain.NewAppError(domain.ErrCodeValidation, "score must be between 1 and 100", nil)
		}
		if _, exists := criteriaWeights[inp.CriteriaID]; !exists {
			return nil, domain.NewAppError(domain.ErrCodeValidation, "invalid or inactive criteria_id", nil)
		}
		scores = append(scores, &domain.AssessmentScore{
			AssessmentResultID: assessmentID,
			CriteriaID:         inp.CriteriaID,
			Score:              inp.Score,
			Note:               inp.Note,
		})
	}

	if err := u.scoreRepo.BulkCreate(ctx, scores); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to save scores", err)
	}

	// Recalculate total_score: Σ(score × weight)
	allScores, err := u.scoreRepo.GetByAssessmentID(ctx, assessmentID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve all scores for recalculation", err)
	}

	var totalScore float64
	for _, s := range allScores {
		weight, ok := criteriaWeights[s.CriteriaID]
		if ok {
			totalScore += float64(s.Score) * weight
		}
	}
	assessment.TotalScore = totalScore
	if err := u.assessmentRepo.Update(ctx, assessment); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update total score", err)
	}

	return scores, nil
}

// GetScores retrieves all scores for a given assessment.
func (u *assessmentScoreUsecase) GetScores(ctx context.Context, assessmentID int64, callerUserID int64) ([]*domain.AssessmentScore, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !canViewParticipants(caller.Category) {
		return nil, forbiddenErr("insufficient permissions to view scores")
	}

	assessment, err := u.assessmentRepo.GetByID(ctx, assessmentID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve assessment", err)
	}
	if assessment == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "assessment not found", nil)
	}

	scores, err := u.scoreRepo.GetByAssessmentID(ctx, assessmentID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve scores", err)
	}
	return scores, nil
}
