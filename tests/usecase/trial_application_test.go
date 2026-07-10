package usecase_test

import (
	"context"
	"testing"
	"time"

	"njara-platform/internal/usecase"

	"njara-platform/internal/domain"
)

// ─── Mocks ────────────────────────────────────────────────────────────────────

type mockAppRepo struct {
	app       *domain.TrialApplication
	apps      []*domain.TrialApplication
	count     int64
	createErr error
	updateErr error
}

func (m *mockAppRepo) Create(ctx context.Context, a *domain.TrialApplication) error {
	if m.createErr != nil {
		return m.createErr
	}
	a.ID = 1
	a.CreatedAt = time.Now()
	a.UpdatedAt = time.Now()
	return nil
}
func (m *mockAppRepo) Update(ctx context.Context, a *domain.TrialApplication) error {
	if m.updateErr != nil {
		return m.updateErr
	}
	a.UpdatedAt = time.Now()
	return nil
}
func (m *mockAppRepo) GetByID(ctx context.Context, id int64) (*domain.TrialApplication, error) {
	return m.app, nil
}
func (m *mockAppRepo) GetByTrialAndPlayer(ctx context.Context, tID, pID int64) (*domain.TrialApplication, error) {
	return m.app, nil
}
func (m *mockAppRepo) GetByTrialID(ctx context.Context, tID int64) ([]*domain.TrialApplication, error) {
	return m.apps, nil
}
func (m *mockAppRepo) GetByPlayerID(ctx context.Context, pID int64) ([]*domain.TrialApplication, error) {
	return m.apps, nil
}
func (m *mockAppRepo) CountByTrialAndStatus(ctx context.Context, tID int64, status string) (int64, error) {
	return m.count, nil
}

type mockParticipantRepo struct {
	participant *domain.TrialParticipant
	count       int64
	createErr   error
}

func (m *mockParticipantRepo) Create(ctx context.Context, p *domain.TrialParticipant) error {
	if m.createErr != nil {
		return m.createErr
	}
	p.ID = 1
	return nil
}
func (m *mockParticipantRepo) Update(ctx context.Context, p *domain.TrialParticipant) error {
	p.UpdatedAt = time.Now()
	return nil
}
func (m *mockParticipantRepo) GetByID(ctx context.Context, id int64) (*domain.TrialParticipant, error) {
	return m.participant, nil
}
func (m *mockParticipantRepo) GetByTrialID(ctx context.Context, tID int64) ([]*domain.TrialParticipant, error) {
	return nil, nil
}
func (m *mockParticipantRepo) GetByTrialAndPlayer(ctx context.Context, tID, pID int64) (*domain.TrialParticipant, error) {
	return m.participant, nil
}
func (m *mockParticipantRepo) GetByApplicationID(ctx context.Context, aID int64) (*domain.TrialParticipant, error) {
	return m.participant, nil
}
func (m *mockParticipantRepo) CountByTrial(ctx context.Context, tID int64) (int64, error) {
	return m.count, nil
}

type mockB2CSubscriptionRepo struct {
	isPremium bool
}

func (m *mockB2CSubscriptionRepo) GetAllPlans(ctx context.Context) ([]*domain.B2CSubscriptionPlan, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) GetPlanByID(ctx context.Context, id int64) (*domain.B2CSubscriptionPlan, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) CreatePlan(ctx context.Context, plan *domain.B2CSubscriptionPlan) error {
	return nil
}
func (m *mockB2CSubscriptionRepo) CreateSubscription(ctx context.Context, sub *domain.B2CSubscription) error {
	return nil
}
func (m *mockB2CSubscriptionRepo) GetSubscriptionByID(ctx context.Context, id int64) (*domain.B2CSubscription, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) GetSubscriptionByOrderID(ctx context.Context, orderID string) (*domain.B2CSubscription, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) GetActiveSubscriptionByUserID(ctx context.Context, userID int64) (*domain.B2CSubscription, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) GetSubscriptionsByUserID(ctx context.Context, userID int64) ([]*domain.B2CSubscription, error) {
	return nil, nil
}
func (m *mockB2CSubscriptionRepo) UpdateSubscription(ctx context.Context, sub *domain.B2CSubscription) error {
	return nil
}
func (m *mockB2CSubscriptionRepo) IsUserPremium(ctx context.Context, userID int64) (bool, error) {
	return m.isPremium, nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func publishedTrial(clubID int64, maxP int) *domain.Trial {
	return &domain.Trial{
		ID: 1, ClubID: clubID, Status: domain.TrialStatusPublished,
		MaxParticipants: maxP,
	}
}

func newAppUsecase(user *domain.User, trial *domain.Trial, appRepo *mockAppRepo, pRepo *mockParticipantRepo) domain.TrialApplicationUsecase {
	return usecase.NewTrialApplicationUsecase(appRepo, &mockTrialRepo{trial: trial}, pRepo, &mockUserRepoForTrial2{user: user}, &mockB2CSubscriptionRepo{isPremium: true})
}

// ─── Tests: Apply ─────────────────────────────────────────────────────────────

func TestApply_PlayerSuccess(t *testing.T) {
	// No existing app
	repo := &mockAppRepo{app: nil, count: 0}
	uc := newAppUsecase(playerUser2(1), publishedTrial(1, 10), repo, &mockParticipantRepo{})
	app, err := uc.Apply(context.Background(), 1, 3)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if app.Status != domain.ApplicationStatusApplied {
		t.Errorf("expected APPLIED status, got %s", app.Status)
	}
}

func TestApply_OwnerForbidden(t *testing.T) {
	repo := &mockAppRepo{app: nil}
	uc := newAppUsecase(ownerUser2(1), publishedTrial(1, 10), repo, &mockParticipantRepo{})
	_, err := uc.Apply(context.Background(), 1, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for non-player, got %v", err)
	}
}

func TestApply_DuplicateConflict(t *testing.T) {
	existing := &domain.TrialApplication{ID: 5, Status: domain.ApplicationStatusApplied}
	repo := &mockAppRepo{app: existing}
	uc := newAppUsecase(playerUser2(1), publishedTrial(1, 10), repo, &mockParticipantRepo{})
	_, err := uc.Apply(context.Background(), 1, 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeConflict {
		t.Errorf("expected ErrCodeConflict for duplicate, got %v", err)
	}
}

func TestApply_MaxParticipantsReached(t *testing.T) {
	// app is nil (no existing), but shortlisted count = max
	repo := &mockAppRepo{app: nil, count: 10}
	uc := newAppUsecase(playerUser2(1), publishedTrial(1, 10), repo, &mockParticipantRepo{})
	_, err := uc.Apply(context.Background(), 1, 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeBadRequest {
		t.Errorf("expected ErrCodeBadRequest for max reached, got %v", err)
	}
}

func TestApply_TrialNotPublished(t *testing.T) {
	closedTrial := &domain.Trial{ID: 1, ClubID: 1, Status: domain.TrialStatusClosed}
	repo := &mockAppRepo{app: nil}
	uc := usecase.NewTrialApplicationUsecase(repo, &mockTrialRepo{trial: closedTrial}, &mockParticipantRepo{}, &mockUserRepoForTrial2{user: playerUser2(1)}, &mockB2CSubscriptionRepo{isPremium: true})
	_, err := uc.Apply(context.Background(), 1, 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeBadRequest {
		t.Errorf("expected ErrCodeBadRequest for closed trial, got %v", err)
	}
}

// ─── Tests: Shortlist ─────────────────────────────────────────────────────────

func TestShortlist_Success(t *testing.T) {
	existingApp := &domain.TrialApplication{ID: 1, TrialID: 1, PlayerID: 3, Status: domain.ApplicationStatusApplied}
	trial := publishedTrial(1, 10)
	repo := &mockAppRepo{app: existingApp, count: 0}
	pRepo := &mockParticipantRepo{participant: nil, count: 0}
	uc := newAppUsecase(ownerUser2(1), trial, repo, pRepo)
	app, err := uc.Shortlist(context.Background(), 1, "great profile", 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if app.Status != domain.ApplicationStatusShortlisted {
		t.Errorf("expected SHORTLISTED, got %s", app.Status)
	}
}

func TestShortlist_PlayerForbidden(t *testing.T) {
	existingApp := &domain.TrialApplication{ID: 1, TrialID: 1, Status: domain.ApplicationStatusApplied}
	repo := &mockAppRepo{app: existingApp, count: 0}
	uc := newAppUsecase(playerUser2(1), publishedTrial(1, 10), repo, &mockParticipantRepo{})
	_, err := uc.Shortlist(context.Background(), 1, "", 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for player, got %v", err)
	}
}

// ─── Tests: GetMyApplications ─────────────────────────────────────────────────

func TestGetMyApplications_PlayerSuccess(t *testing.T) {
	apps := []*domain.TrialApplication{
		{ID: 1, Status: domain.ApplicationStatusApplied},
		{ID: 2, Status: domain.ApplicationStatusShortlisted},
	}
	repo := &mockAppRepo{apps: apps}
	uc := newAppUsecase(playerUser2(1), nil, repo, &mockParticipantRepo{})
	result, err := uc.GetMyApplications(context.Background(), 3)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if len(result) != 2 {
		t.Errorf("expected 2 applications, got %d", len(result))
	}
}

func TestGetMyApplications_OwnerForbidden(t *testing.T) {
	repo := &mockAppRepo{}
	uc := newAppUsecase(ownerUser2(1), nil, repo, &mockParticipantRepo{})
	_, err := uc.GetMyApplications(context.Background(), 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for owner, got %v", err)
	}
}
