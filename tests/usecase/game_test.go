package usecase_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"njara-platform/internal/usecase" 

	"njara-platform/internal/domain"
)

type mockGameRepository struct {
	games []domain.Game
	err   error
}

func (m *mockGameRepository) GetAll(ctx context.Context) ([]domain.Game, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.games, nil
}

func (m *mockGameRepository) Create(ctx context.Context, game *domain.Game) error {
	return nil
}

func (m *mockGameRepository) GetByName(ctx context.Context, name string) (*domain.Game, error) {
	return nil, nil
}

func TestGameGetList_Success(t *testing.T) {
	mockGames := []domain.Game{
		{ID: 1, Name: "Mobile Legend", CreatedAt: time.Now(), UpdatedAt: time.Now()},
		{ID: 2, Name: "Honor Of Kings", CreatedAt: time.Now(), UpdatedAt: time.Now()},
	}
	repo := &mockGameRepository{games: mockGames}
	uc := usecase.NewGameUsecase(repo)

	res, err := uc.GetList(context.Background())
	if err != nil {
		t.Fatalf("expected no error, got %v", err)
	}

	if len(res) != 2 {
		t.Errorf("expected 2 games, got %d", len(res))
	}
	if res[0].Name != "Mobile Legend" {
		t.Errorf("expected Mobile Legend, got %s", res[0].Name)
	}
}

func TestGameGetList_Error(t *testing.T) {
	expectedErr := errors.New("db error")
	repo := &mockGameRepository{err: expectedErr}
	uc := usecase.NewGameUsecase(repo)

	_, err := uc.GetList(context.Background())
	if err == nil || err.Error() != "db error" {
		t.Fatalf("expected db error, got %v", err)
	}
}
