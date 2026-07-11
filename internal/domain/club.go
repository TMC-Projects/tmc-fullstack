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
	ID                int64     `json:"id"`
	ClubID            int64     `json:"club_id"`
	Title             string    `json:"title"`
	TournamentName    string    `json:"tournament_name"`
	GameTitle         string    `json:"game_title"`
	Placement         string    `json:"placement"`
	AchievementDate   time.Time `json:"achievement_date"`
	TournamentTier    string    `json:"tournament_tier,omitempty"`
	PrizePoolCurrency string    `json:"prize_pool_currency,omitempty"`
	PrizePoolAmount   *float64  `json:"prize_pool_amount,omitempty"`
	EventScale        string    `json:"event_scale,omitempty"`
	ReferenceUrl      string    `json:"reference_url,omitempty"`
	CertificateUrl    string    `json:"certificate_url,omitempty"`
	CreatedAt         time.Time `json:"created_at"`
	UpdatedAt         time.Time `json:"updated_at"`
}

// ClubOnboarding represents the request for a club to verify its data
type ClubOnboarding struct {
	ID               int64     `json:"id" gorm:"primaryKey"`
	ClubID           int64     `json:"club_id"`
	OrganizationName string    `json:"organization_name"`
	NIB              string    `json:"nib"`
	NPWP             string    `json:"npwp"`
	Status           string    `json:"status"` // "pending", "approved", "rejected"
	OnboardingBy     int64     `json:"onboarding_by"` // User ID of owner/manager
	CreatedAt        time.Time `json:"created_at"`
	UpdatedAt        time.Time `json:"updated_at"`
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

	// Onboarding operations
	CreateOnboarding(ctx context.Context, onboarding *ClubOnboarding) error
	GetLatestOnboardingByClubID(ctx context.Context, clubID int64) (*ClubOnboarding, error)
	GetOnboardingByID(ctx context.Context, id int64) (*ClubOnboarding, error)
	UpdateOnboarding(ctx context.Context, onboarding *ClubOnboarding) error
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

	// Onboarding operations
	SubmitOnboarding(ctx context.Context, clubID int64, input ClubOnboarding, userID int64) (*ClubOnboarding, error)
	GetLatestOnboarding(ctx context.Context, clubID int64, userID int64) (*ClubOnboarding, error)
	ApproveOnboarding(ctx context.Context, onboardingID int64, adminID int64) error
	RejectOnboarding(ctx context.Context, onboardingID int64, adminID int64) error
}
