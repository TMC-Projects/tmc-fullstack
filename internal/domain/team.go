package domain

import (
	"context"
	"time"
)

type Team struct {
	ID          int64     `json:"id"`
	ClubID      int64     `json:"club_id"`
	OwnerID     *int64    `json:"owner_id,omitempty"`
	GameID      int64     `json:"game_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	LogoUrl     string    `json:"logo_url"`
	Status      string    `json:"status"` // "active", "inactive"
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`

	// Relations
	Club *Club `json:"club,omitempty"`
	Game *Game `json:"game,omitempty"`
}

type TeamRepository interface {
	Create(ctx context.Context, team *Team) error
	Update(ctx context.Context, team *Team) error
	GetByID(ctx context.Context, id int64) (*Team, error)
	GetByClubID(ctx context.Context, clubID int64) ([]*Team, error)
	GetByOwnerID(ctx context.Context, ownerID int64) ([]*Team, error)
	Delete(ctx context.Context, id int64) error
}

type TeamUsecase interface {
	CreateTeam(ctx context.Context, input *Team, userID int64) (*Team, error)
	UpdateTeam(ctx context.Context, teamID int64, input *Team, userID int64) (*Team, error)
	GetTeamsByClubID(ctx context.Context, clubID int64, userID int64) ([]*Team, error)
	GetTeamByID(ctx context.Context, teamID int64, userID int64) (*Team, error)
	DeleteTeam(ctx context.Context, teamID int64, userID int64) error
	AssignUser(ctx context.Context, teamID int64, targetUserID int64, adminUserID int64) error
}
