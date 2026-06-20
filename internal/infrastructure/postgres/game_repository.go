package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type gameRepository struct {
	db *gorm.DB
}

// NewGameRepository creates a new instance of domain.GameRepository using GORM.
func NewGameRepository(db *gorm.DB) domain.GameRepository {
	return &gameRepository{db: db}
}

func (r *gameRepository) GetAll(ctx context.Context) ([]domain.Game, error) {
	var models []GameModel
	err := r.db.WithContext(ctx).Order("id ASC").Find(&models).Error
	if err != nil {
		return nil, err
	}

	games := make([]domain.Game, len(models))
	for i, m := range models {
		games[i] = m.ToDomain()
	}
	return games, nil
}

func (r *gameRepository) Create(ctx context.Context, game *domain.Game) error {
	m := GameFromDomain(game)
	err := r.db.WithContext(ctx).Create(m).Error
	if err != nil {
		return err
	}
	game.ID = m.ID
	game.CreatedAt = m.CreatedAt
	game.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *gameRepository) GetByName(ctx context.Context, name string) (*domain.Game, error) {
	var m GameModel
	err := r.db.WithContext(ctx).Where("name = ?", name).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	game := m.ToDomain()
	return &game, nil
}
