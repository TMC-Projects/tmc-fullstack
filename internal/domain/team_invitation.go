package domain

import (
	"context"
	"time"
)

type TeamInvitation struct {
	ID        int64      `json:"id"`
	ClubID    int64      `json:"club_id"`
	TeamID    *int64     `json:"team_id"`
	PlayerID  int64      `json:"player_id"`
	Status    string     `json:"status"` // pending, accepted, rejected
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`

	// Relationships for display purposes
	Club   *Club `json:"club,omitempty"`
	Team   *Team `json:"team,omitempty"`
}

type TeamInvitationRepository interface {
	Create(ctx context.Context, invitation *TeamInvitation) error
	GetByID(ctx context.Context, id int64) (*TeamInvitation, error)
	GetByPlayerID(ctx context.Context, playerID int64) ([]TeamInvitation, error)
	GetPendingByPlayerAndClub(ctx context.Context, playerID, clubID int64) (*TeamInvitation, error)
	GetPendingPlayerIDsByClub(ctx context.Context, clubID int64) ([]int64, error)
	UpdateStatus(ctx context.Context, id int64, status string) error
	RejectAllPendingForPlayer(ctx context.Context, playerID int64, exceptID int64) error
}

type TeamInvitationUsecase interface {
	GetMyInvitations(ctx context.Context, playerID int64) ([]TeamInvitation, error)
	RespondInvitation(ctx context.Context, invitationID int64, playerID int64, accept bool) error
}
