package domain

import (
	"context"
	"time"
)

// Club represents an eSports Club in the B2B or B2C platform.
type Club struct {
	ID               int64      `json:"id"`
	Name             string     `json:"name"`
	Address          string     `json:"address"`
	Country          string     `json:"country"`
	EstablishedYear  int        `json:"established_year"`
	Category         string     `json:"category"` // "club", "team"
	Status           string     `json:"status"`   // "trial", "full", "expired"
	Verify           bool       `json:"verify"`
	LogoUrl          string     `json:"logo_url"`
	OrganizationName string     `json:"organization_name,omitempty"`
	NIB              string     `json:"nib,omitempty"`
	NPWP             string     `json:"npwp,omitempty"`
	ExpiredDate      *time.Time         `json:"expired_date,omitempty"`
	CreatedAt        time.Time          `json:"created_at"`
	UpdatedAt        time.Time          `json:"updated_at"`
	Achievements     []ClubAchievement  `json:"achievements"`
}

// ClubAchievement represents a notable achievement/award for a Club
type ClubAchievement struct {
	ID          int64     `json:"id"`
	ClubID      int64     `json:"club_id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// ClubRepository defines the outbound port for Club database persistence.
type ClubRepository interface {
	Create(ctx context.Context, club *Club) error
	Update(ctx context.Context, club *Club) error
	GetByName(ctx context.Context, name string) (*Club, error)
	GetByID(ctx context.Context, id int64) (*Club, error)
	GetAll(ctx context.Context) ([]*Club, error)

	// Achievement operations
	CreateAchievement(ctx context.Context, ach *ClubAchievement) error
	UpdateAchievement(ctx context.Context, ach *ClubAchievement) error
	DeleteAchievement(ctx context.Context, id int64) error
	GetAchievementByID(ctx context.Context, id int64) (*ClubAchievement, error)
}

type ClubUsecase interface {
	CreateClub(ctx context.Context, club *Club, userID int64) (*Club, error)
	UpdateClub(ctx context.Context, clubID int64, input *Club, userID int64) (*Club, error)
	GetAllClubs(ctx context.Context) ([]*Club, error)
	GetClubByID(ctx context.Context, id int64) (*Club, error)
	UploadLogo(ctx context.Context, clubID int64, url string) error

	// Achievement operations
	AddAchievement(ctx context.Context, clubID int64, input ClubAchievement, userID int64) (*ClubAchievement, error)
	UpdateAchievement(ctx context.Context, clubID int64, achID int64, input ClubAchievement, userID int64) (*ClubAchievement, error)
	DeleteAchievement(ctx context.Context, clubID int64, achID int64, userID int64) error
}
