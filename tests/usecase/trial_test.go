package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"njara-platform/internal/usecase"

	"njara-platform/internal/domain"
)

// ─── Mock: TrialRepository ────────────────────────────────────────────────────

type mockTrialRepo struct {
	trial  *domain.Trial
	trials []*domain.Trial
	total  int64
	err    error
}

func (m *mockTrialRepo) Create(ctx context.Context, t *domain.Trial) error {
	if m.err != nil {
		return m.err
	}
	t.ID = 1
	t.CreatedAt = time.Now()
	t.UpdatedAt = time.Now()
	return nil
}
func (m *mockTrialRepo) Update(ctx context.Context, t *domain.Trial) error {
	if m.err != nil {
		return m.err
	}
	t.UpdatedAt = time.Now()
	return nil
}
func (m *mockTrialRepo) GetByID(ctx context.Context, id int64) (*domain.Trial, error) {
	return m.trial, m.err
}
func (m *mockTrialRepo) GetList(ctx context.Context, f domain.TrialFilter) ([]*domain.Trial, int64, error) {
	return m.trials, m.total, m.err
}

// ─── Mock: UserRepository (for trial tests) ──────────────────────────────────

type mockUserRepoForTrial2 struct {
	user *domain.User
	err  error
}

func (m *mockUserRepoForTrial2) Create(ctx context.Context, u *domain.User) error { return nil }
func (m *mockUserRepoForTrial2) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	return m.user, m.err
}
func (m *mockUserRepoForTrial2) GetByEmail(ctx context.Context, e string) (*domain.User, error) {
	return nil, nil
}
func (m *mockUserRepoForTrial2) GetByUsername(ctx context.Context, u string) (*domain.User, error) {
	return nil, nil
}
func (m *mockUserRepoForTrial2) GetByCategoryAndClub(ctx context.Context, cat string, clubID int64) ([]*domain.User, error) {
	return nil, nil
}
func (m *mockUserRepoForTrial2) UpdateClubID(ctx context.Context, uID, cID int64) error { return nil }
func (m *mockUserRepoForTrial2) GetTalents(ctx context.Context, f domain.TalentFilter) ([]*domain.TalentResult, int64, error) {
	return nil, 0, nil
}
func (m *mockUserRepoForTrial2) UpdateMarketValue(ctx context.Context, uID int64, v *int64) error {
	return nil
}
func (m *mockUserRepoForTrial2) UpdateContractAndSalary(ctx context.Context, uID int64, c *time.Time, s *int64) error {
	return nil
}
func (m *mockUserRepoForTrial2) UpdateProfile(ctx context.Context, u *domain.User) error { return nil }
func (m *mockUserRepoForTrial2) UpdateProfilePicture(ctx context.Context, userID int64, url string) error {
	return nil
}
func (m *mockUserRepoForTrial2) UpdateStatus(ctx context.Context, uID int64, s string) error {
	return nil
}
func (m *mockUserRepoForTrial2) UpdateTeamID(ctx context.Context, uID int64, tID *int64) error {
	return nil
}
func (m *mockUserRepoForTrial2) UpdatePassword(ctx context.Context, uID int64, hash string) error {
	return nil
}

// ─── Mock: ClubRepository (for trial tests) ──────────────────────────────────

type mockClubRepoForTrial2 struct {
	club *domain.Club
}

func (m *mockClubRepoForTrial2) Create(ctx context.Context, c *domain.Club) error { return nil }
func (m *mockClubRepoForTrial2) Update(ctx context.Context, c *domain.Club) error { return nil }
func (m *mockClubRepoForTrial2) GetByName(ctx context.Context, n string) (*domain.Club, error) {
	return nil, nil
}
func (m *mockClubRepoForTrial2) GetByID(ctx context.Context, id int64) (*domain.Club, error) {
	return m.club, nil
}
func (m *mockClubRepoForTrial2) GetAll(ctx context.Context) ([]*domain.Club, error) {
	return nil, nil
}
func (m *mockClubRepoForTrial2) CreateAchievement(ctx context.Context, ach *domain.ClubAchievement) error {
	return nil
}
func (m *mockClubRepoForTrial2) UpdateAchievement(ctx context.Context, ach *domain.ClubAchievement) error {
	return nil
}
func (m *mockClubRepoForTrial2) DeleteAchievement(ctx context.Context, id int64) error { return nil }
func (m *mockClubRepoForTrial2) GetAchievementByID(ctx context.Context, id int64) (*domain.ClubAchievement, error) {
	return nil, nil
}
func (m *mockClubRepoForTrial2) CreateOnboarding(ctx context.Context, o *domain.ClubOnboarding) error {
	return nil
}
func (m *mockClubRepoForTrial2) GetLatestOnboardingByClubID(ctx context.Context, clubID int64) (*domain.ClubOnboarding, error) {
	return nil, nil
}
func (m *mockClubRepoForTrial2) GetOnboardingByID(ctx context.Context, id int64) (*domain.ClubOnboarding, error) {
	return nil, nil
}
func (m *mockClubRepoForTrial2) UpdateOnboarding(ctx context.Context, o *domain.ClubOnboarding) error {
	return nil
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

func ownerUser2(clubID int64) *domain.User {
	return &domain.User{ID: 1, ClubID: clubID, Category: "owner"}
}
func managerUser2(clubID int64) *domain.User {
	return &domain.User{ID: 2, ClubID: clubID, Category: "manager"}
}
func playerUser2(clubID int64) *domain.User {
	return &domain.User{ID: 3, ClubID: clubID, Category: "player"}
}

func validTrialInput() domain.CreateTrialInput {
	return domain.CreateTrialInput{
		GameID:          1,
		Title:           "MLBB Open Trial S1",
		Description:     "Open for mid-lane",
		StartDate:       time.Now().Add(24 * time.Hour),
		EndDate:         time.Now().Add(48 * time.Hour),
		MaxParticipants: 10,
	}
}

func newTrialUsecase(user *domain.User, trialRepo *mockTrialRepo) domain.TrialUsecase {
	return usecase.NewTrialUsecase(trialRepo, &mockUserRepoForTrial2{user: user}, &mockClubRepoForTrial2{})
}

// ─── Tests: CreateTrial ───────────────────────────────────────────────────────

func TestTrial_CreateSuccess_Owner(t *testing.T) {
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{})
	trial, err := uc.CreateTrial(context.Background(), validTrialInput(), 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if trial.Status != domain.TrialStatusDraft {
		t.Errorf("expected DRAFT status, got %s", trial.Status)
	}
}

func TestTrial_CreateSuccess_Manager(t *testing.T) {
	uc := newTrialUsecase(managerUser2(1), &mockTrialRepo{})
	_, err := uc.CreateTrial(context.Background(), validTrialInput(), 2)
	if err != nil {
		t.Fatalf("manager should be allowed, got %v", err)
	}
}

func TestTrial_CreateForbidden_Player(t *testing.T) {
	uc := newTrialUsecase(playerUser2(1), &mockTrialRepo{})
	_, err := uc.CreateTrial(context.Background(), validTrialInput(), 3)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden, got %v", err)
	}
}

func TestTrial_CreateValidation_MissingTitle(t *testing.T) {
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{})
	input := validTrialInput()
	input.Title = ""
	_, err := uc.CreateTrial(context.Background(), input, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeValidation {
		t.Errorf("expected ErrCodeValidation for missing title, got %v", err)
	}
}

func TestTrial_CreateValidation_EndBeforeStart(t *testing.T) {
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{})
	input := validTrialInput()
	input.EndDate = input.StartDate.Add(-1 * time.Hour)
	_, err := uc.CreateTrial(context.Background(), input, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeValidation {
		t.Errorf("expected ErrCodeValidation for end before start, got %v", err)
	}
}

func TestTrial_CreateRepoError(t *testing.T) {
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{err: errors.New("db error")})
	_, err := uc.CreateTrial(context.Background(), validTrialInput(), 1)
	if err == nil {
		t.Fatal("expected error from repo")
	}
}

// ─── Tests: UpdateTrial ───────────────────────────────────────────────────────

func TestTrial_UpdateSuccess(t *testing.T) {
	existing := &domain.Trial{ID: 1, ClubID: 1, Status: domain.TrialStatusDraft,
		StartDate: time.Now(), EndDate: time.Now().Add(48 * time.Hour)}
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{trial: existing})
	updated, err := uc.UpdateTrial(context.Background(), 1, domain.UpdateTrialInput{Title: "New Title", Status: domain.TrialStatusPublished}, 1)
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if updated.Title != "New Title" || updated.Status != domain.TrialStatusPublished {
		t.Errorf("expected updated fields, got title=%s status=%s", updated.Title, updated.Status)
	}
}

func TestTrial_UpdateCrossClubForbidden(t *testing.T) {
	existing := &domain.Trial{ID: 1, ClubID: 2, Status: domain.TrialStatusDraft,
		StartDate: time.Now(), EndDate: time.Now().Add(24 * time.Hour)}
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{trial: existing})
	_, err := uc.UpdateTrial(context.Background(), 1, domain.UpdateTrialInput{Title: "Hack"}, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeForbidden {
		t.Errorf("expected ErrCodeForbidden for cross-club update, got %v", err)
	}
}

func TestTrial_UpdateInvalidStatus(t *testing.T) {
	existing := &domain.Trial{ID: 1, ClubID: 1, Status: domain.TrialStatusDraft,
		StartDate: time.Now(), EndDate: time.Now().Add(24 * time.Hour)}
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{trial: existing})
	_, err := uc.UpdateTrial(context.Background(), 1, domain.UpdateTrialInput{Status: "INVALID"}, 1)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeValidation {
		t.Errorf("expected ErrCodeValidation for invalid status, got %v", err)
	}
}

// ─── Tests: GetTrials ─────────────────────────────────────────────────────────

func TestTrial_GetList(t *testing.T) {
	trials := []*domain.Trial{
		{ID: 1, Title: "Trial 1"}, {ID: 2, Title: "Trial 2"},
	}
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{trials: trials, total: 2})
	result, total, err := uc.GetTrials(context.Background(), domain.TrialFilter{Page: 1, Limit: 10})
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}
	if total != 2 || len(result) != 2 {
		t.Errorf("expected 2 results, got total=%d len=%d", total, len(result))
	}
}

func TestTrial_GetByIDNotFound(t *testing.T) {
	uc := newTrialUsecase(ownerUser2(1), &mockTrialRepo{trial: nil})
	_, err := uc.GetTrialByID(context.Background(), 999)
	appErr, _ := err.(*domain.AppError)
	if appErr == nil || appErr.Code != domain.ErrCodeNotFound {
		t.Errorf("expected ErrCodeNotFound, got %v", err)
	}
}
