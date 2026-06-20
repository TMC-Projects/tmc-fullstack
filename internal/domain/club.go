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
	ExpiredDate      *time.Time `json:"expired_date,omitempty"`
	CreatedAt        time.Time  `json:"created_at"`
	UpdatedAt        time.Time  `json:"updated_at"`
}

// ClubRepository defines the outbound port for Club database persistence.
type ClubRepository interface {
	Create(ctx context.Context, club *Club) error
	Update(ctx context.Context, club *Club) error
	GetByName(ctx context.Context, name string) (*Club, error)
	GetByID(ctx context.Context, id int64) (*Club, error)
	GetAll(ctx context.Context) ([]*Club, error)
}

type ClubUsecase interface {
	CreateClub(ctx context.Context, club *Club, userID int64) (*Club, error)
	UpdateClub(ctx context.Context, clubID int64, input *Club, userID int64) (*Club, error)
	GetAllClubs(ctx context.Context) ([]*Club, error)
	GetClubByID(ctx context.Context, id int64) (*Club, error)
	UploadLogo(ctx context.Context, clubID int64, url string) error
}
