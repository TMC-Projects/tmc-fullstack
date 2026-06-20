package usecase_test

import (
	"context"
	"testing"

	"njara-platform/internal/usecase" 

	"njara-platform/internal/domain"
)

func newRecruitmentUsecase(user *domain.User, trial *domain.Trial, participant *domain.TrialParticipant, existingDecision *domain.RecruitmentDecision) domain.RecruitmentDecisionUsecase {
	decisionRepo := &mockRecruitmentDecisionRepo{decision: existingDecision}
	participantRepo := &mockParticipantRepo{participant: participant}
	trialRepo := &mockTrialRepo{trial: trial}
	userRepo := &mockUserRepoForTrial2{user: user}
	appRepo := &mockTrialAppRepo{}
	return usecase.NewRecruitmentDecisionUsecase(decisionRepo, participantRepo, trialRepo, userRepo, appRepo)
}

type mockTrialAppRepo struct {
	app  *domain.TrialApplication
	apps []*domain.TrialApplication
	err  error
}

func (m *mockTrialAppRepo) Create(ctx context.Context, app *domain.TrialApplication) error { return m.err }
func (m *mockTrialAppRepo) Update(ctx context.Context, app *domain.TrialApplication) error { return m.err }
func (m *mockTrialAppRepo) GetByID(ctx context.Context, id int64) (*domain.TrialApplication, error) { return m.app, m.err }
func (m *mockTrialAppRepo) GetByTrialAndPlayer(ctx context.Context, trialID, playerID int64) (*domain.TrialApplication, error) { return m.app, m.err }
func (m *mockTrialAppRepo) GetByTrialID(ctx context.Context, trialID int64) ([]*domain.TrialApplication, error) { return m.apps, m.err }
func (m *mockTrialAppRepo) GetByPlayerID(ctx context.Context, playerID int64) ([]*domain.TrialApplication, error) { return m.apps, m.err }
func (m *mockTrialAppRepo) CountByTrialAndStatus(ctx context.Context, trialID int64, status string) (int64, error) { return 0, m.err }

type mockRecruitmentDecisionRepo struct {
	decision  *domain.RecruitmentDecision
	decisions []*domain.RecruitmentDecision
	err       error
}

func (m *mockRecruitmentDecisionRepo) Create(ctx context.Context, d *domain.RecruitmentDecision) error {
	if m.err != nil {
		return m.err
	}
	d.ID = 1
	return nil
}
func (m *mockRecruitmentDecisionRepo) Update(ctx context.Context, d *domain.RecruitmentDecision) error {
	return m.err
}
func (m *mockRecruitmentDecisionRepo) GetByParticipantID(ctx context.Context, pID int64) (*domain.RecruitmentDecision, error) {
	return m.decision, m.err
}
func (m *mockRecruitmentDecisionRepo) GetByTrialID(ctx context.Context, tID int64) ([]*domain.RecruitmentDecision, error) {
	return m.decisions, m.err
}

// ─── Tests: CreateDecision ────────────────────────────────────────────────────

func TestDecision_AcceptedSuccess(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1, PlayerID: 3, FinalResult: domain.FinalResultPending}
	trial := &domain.Trial{ID: 1, ClubID: 1, Status: domain.TrialStatusCompleted}
	uc := newRecruitmentUsecase(ownerUser2(1), trial, participant, nil)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: domain.DecisionAccepted, Remarks: "Great potential"}
	decision, err := uc.CreateDecision(context.Background(), input, 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if decision.Decision != domain.DecisionAccepted {
		t.Errorf("expected ACCEPTED, got %s", decision.Decision)
	}
}

func TestDecision_RejectedSuccess(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1, PlayerID: 3, FinalResult: domain.FinalResultPending}
	trial := &domain.Trial{ID: 1, ClubID: 1, Status: domain.TrialStatusCompleted}
	uc := newRecruitmentUsecase(ownerUser2(1), trial, participant, nil)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: domain.DecisionRejected}
	decision, err := uc.CreateDecision(context.Background(), input, 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if decision.Decision != domain.DecisionRejected {
		t.Errorf("expected REJECTED, got %s", decision.Decision)
	}
}

func TestDecision_PlayerForbidden(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1}
	trial := &domain.Trial{ID: 1, ClubID: 1}
	uc := newRecruitmentUsecase(playerUser2(1), trial, participant, nil)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: domain.DecisionAccepted}
	_, err := uc.CreateDecision(context.Background(), input, 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for player, got %v", err)
	}
}

func TestDecision_DuplicateConflict(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1}
	trial := &domain.Trial{ID: 1, ClubID: 1}
	existingDecision := &domain.RecruitmentDecision{ID: 5, Decision: domain.DecisionAccepted}
	uc := newRecruitmentUsecase(ownerUser2(1), trial, participant, existingDecision)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: domain.DecisionRejected}
	_, err := uc.CreateDecision(context.Background(), input, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeConflict {
		t.Errorf("expected ErrCodeConflict for duplicate, got %v", err)
	}
}

func TestDecision_InvalidDecisionValue(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1}
	trial := &domain.Trial{ID: 1, ClubID: 1}
	uc := newRecruitmentUsecase(ownerUser2(1), trial, participant, nil)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: "MAYBE"}
	_, err := uc.CreateDecision(context.Background(), input, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeValidation {
		t.Errorf("expected ErrCodeValidation for invalid decision, got %v", err)
	}
}

func TestDecision_CrossClubForbidden(t *testing.T) {
	participant := &domain.TrialParticipant{ID: 1, TrialID: 1}
	trial := &domain.Trial{ID: 1, ClubID: 2} // Different club
	uc := newRecruitmentUsecase(ownerUser2(1), trial, participant, nil)

	input := domain.CreateDecisionInput{TrialID: 1, ParticipantID: 1, Decision: domain.DecisionAccepted}
	_, err := uc.CreateDecision(context.Background(), input, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for cross-club, got %v", err)
	}
}

// ─── Tests: AssessmentScore ───────────────────────────────────────────────────

type mockAssessmentScoreRepo struct {
	scores []*domain.AssessmentScore
	err    error
}

func (m *mockAssessmentScoreRepo) BulkCreate(ctx context.Context, scores []*domain.AssessmentScore) error {
	if m.err != nil {
		return m.err
	}
	for i := range scores {
		scores[i].ID = int64(i + 1)
	}
	return nil
}
func (m *mockAssessmentScoreRepo) GetByAssessmentID(ctx context.Context, aID int64) ([]*domain.AssessmentScore, error) {
	return m.scores, m.err
}

type mockAssessmentResultRepo struct {
	result *domain.AssessmentResult
	err    error
}

func (m *mockAssessmentResultRepo) Create(ctx context.Context, r *domain.AssessmentResult) error {
	r.ID = 1
	return m.err
}
func (m *mockAssessmentResultRepo) Update(ctx context.Context, r *domain.AssessmentResult) error {
	return m.err
}
func (m *mockAssessmentResultRepo) GetByID(ctx context.Context, id int64) (*domain.AssessmentResult, error) {
	return m.result, m.err
}
func (m *mockAssessmentResultRepo) GetByParticipantID(ctx context.Context, pID int64) ([]*domain.AssessmentResult, error) {
	if m.result != nil {
		return []*domain.AssessmentResult{m.result}, m.err
	}
	return nil, m.err
}

type mockCriteriaRepo struct {
	criteria []*domain.AssessmentCriteria
}

func (m *mockCriteriaRepo) GetAll(ctx context.Context) ([]*domain.AssessmentCriteria, error) {
	return m.criteria, nil
}
func (m *mockCriteriaRepo) GetActive(ctx context.Context) ([]*domain.AssessmentCriteria, error) {
	return m.criteria, nil
}
func (m *mockCriteriaRepo) GetByID(ctx context.Context, id int64) (*domain.AssessmentCriteria, error) {
	return nil, nil
}
func (m *mockCriteriaRepo) Create(ctx context.Context, c *domain.AssessmentCriteria) error {
	return nil
}
func (m *mockCriteriaRepo) GetByName(ctx context.Context, name string) (*domain.AssessmentCriteria, error) {
	return nil, nil
}

func TestAddScores_CalculatesTotalScore(t *testing.T) {
	criteria := []*domain.AssessmentCriteria{
		{ID: 1, Name: "Mechanical", Weight: 0.20},
		{ID: 2, Name: "Macro", Weight: 0.25},
	}
	// All scores returned for recalculation
	existingScores := []*domain.AssessmentScore{
		{CriteriaID: 1, Score: 90}, // 90 × 0.20 = 18
		{CriteriaID: 2, Score: 80}, // 80 × 0.25 = 20
	}
	// Coach as the assessor
	coachUser := &domain.User{ID: 5, ClubID: 1, Category: "coach"}
	assessment := &domain.AssessmentResult{ID: 1, AssessorID: 5, TotalScore: 0}

	scoreRepo := &mockAssessmentScoreRepo{scores: existingScores}
	assessmentRepo := &mockAssessmentResultRepo{result: assessment}
	criteriaRepo := &mockCriteriaRepo{criteria: criteria}
	userRepo := &mockUserRepoForTrial2{user: coachUser}

	uc := usecase.NewAssessmentScoreUsecase(scoreRepo, assessmentRepo, criteriaRepo, userRepo)
	inputs := []domain.ScoreInput{
		{CriteriaID: 1, Score: 90, Note: "excellent mechanics"},
		{CriteriaID: 2, Score: 80},
	}
	scores, err := uc.AddScores(context.Background(), 1, inputs, 5)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(scores) != 2 {
		t.Errorf("expected 2 scores, got %d", len(scores))
	}
	// Expected total: 90×0.20 + 80×0.25 = 18 + 20 = 38
	if assessment.TotalScore != 38 {
		t.Errorf("expected TotalScore 38, got %.2f", assessment.TotalScore)
	}
}

func TestAddScores_InvalidScoreRange(t *testing.T) {
	criteria := []*domain.AssessmentCriteria{{ID: 1, Weight: 0.20}}
	coachUser := &domain.User{ID: 5, ClubID: 1, Category: "coach"}
	assessment := &domain.AssessmentResult{ID: 1, AssessorID: 5}
	uc := usecase.NewAssessmentScoreUsecase(
		&mockAssessmentScoreRepo{},
		&mockAssessmentResultRepo{result: assessment},
		&mockCriteriaRepo{criteria: criteria},
		&mockUserRepoForTrial2{user: coachUser},
	)
	_, err := uc.AddScores(context.Background(), 1, []domain.ScoreInput{{CriteriaID: 1, Score: 101}}, 5)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeValidation {
		t.Errorf("expected ErrCodeValidation for score > 100, got %v", err)
	}
}

func TestAddScores_NonAssessorForbidden(t *testing.T) {
	playerU := &domain.User{ID: 1, ClubID: 1, Category: "player"}
	assessment := &domain.AssessmentResult{ID: 1, AssessorID: 1}
	uc := usecase.NewAssessmentScoreUsecase(
		&mockAssessmentScoreRepo{},
		&mockAssessmentResultRepo{result: assessment},
		&mockCriteriaRepo{},
		&mockUserRepoForTrial2{user: playerU},
	)
	_, err := uc.AddScores(context.Background(), 1, []domain.ScoreInput{{CriteriaID: 1, Score: 80}}, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for non-assessor, got %v", err)
	}
}
