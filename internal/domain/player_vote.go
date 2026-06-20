package domain

import (
	"context"
	"time"
)

// PlayerVote represents a vote cast for a player.
type PlayerVote struct {
	ID        int64
	PlayerID  int64
	CookieID  string
	IPAddress string
	CreatedAt time.Time
}

// PlayerVoteRepository defines the outbound port for PlayerVote database persistence.
type PlayerVoteRepository interface {
	// CreateVoteAndIncrement saves the vote log and increments the player's vote count atomically.
	CreateVoteAndIncrement(ctx context.Context, playerID int64, cookieID, ipAddress string) error
}

// PlayerVoteUsecase defines the inbound port for voting operations.
type PlayerVoteUsecase interface {
	Vote(ctx context.Context, playerID int64, cookieID, ipAddress string) error
}
