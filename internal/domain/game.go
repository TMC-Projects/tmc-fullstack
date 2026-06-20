package domain

import (
	"context"
	"time"
)

// Game represents an eSports game entity.
type Game struct {
	ID        int64
	Name      string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// GameRepository defines outbound port for Game persistence.
type GameRepository interface {
	GetAll(ctx context.Context) ([]Game, error)
	Create(ctx context.Context, game *Game) error
	GetByName(ctx context.Context, name string) (*Game, error)
}

// GameUsecase defines inbound port for Game business logic.
type GameUsecase interface {
	GetList(ctx context.Context) ([]Game, error)
}
