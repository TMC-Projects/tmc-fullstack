package usecase

import (
	"context"
	"njara-platform/internal/domain"
)

type gameUsecase struct {
	gameRepo domain.GameRepository
}

// NewGameUsecase creates a new instance of domain.GameUsecase.
func NewGameUsecase(gameRepo domain.GameRepository) domain.GameUsecase {
	return &gameUsecase{gameRepo: gameRepo}
}

func (u *gameUsecase) GetList(ctx context.Context) ([]domain.Game, error) {
	return u.gameRepo.GetAll(ctx)
}
