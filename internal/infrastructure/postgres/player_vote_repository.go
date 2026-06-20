package postgres

import (
	"context"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type playerVoteRepository struct {
	db *gorm.DB
}

// NewPlayerVoteRepository creates a new instance of domain.PlayerVoteRepository adapter using GORM.
func NewPlayerVoteRepository(db *gorm.DB) domain.PlayerVoteRepository {
	return &playerVoteRepository{db: db}
}

func (r *playerVoteRepository) CreateVoteAndIncrement(ctx context.Context, playerID int64, cookieID, ipAddress string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 1. Insert vote log
		voteModel := &PlayerVoteModel{
			PlayerID:  playerID,
			CookieID:  cookieID,
			IPAddress: ipAddress,
		}
		if err := tx.Create(voteModel).Error; err != nil {
			return err
		}

		// 2. Increment vote count
		if err := tx.Model(&UserModel{}).Where("id = ?", playerID).UpdateColumn("vote_count", gorm.Expr("vote_count + ?", 1)).Error; err != nil {
			return err
		}

		return nil
	})
}
