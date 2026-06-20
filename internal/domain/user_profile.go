package domain

import (
	"context"
	"time"
)

// UserStat represents a single statistic record for a specific game.
type UserStat struct {
	ID        int64
	UserID    int64
	GameID    int64
	Game      *Game
	StatName  string // e.g., "Win Rate", "KDA", "Matches Played"
	StatValue string // e.g., "55.5%", "4.2", "1500"
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UserSocialMedia represents a social media link for a user.
type UserSocialMedia struct {
	ID        int64
	UserID    int64
	Platform  string // e.g., "Instagram", "Twitter", "LinkedIn"
	Username  string
	URL       string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UserAchievement represents an award or milestone achieved by the user.
type UserAchievement struct {
	ID          int64
	UserID      int64
	Title       string // e.g., "Champion MPL S12"
	Description string
	Year        int
	ImageURL    string // Optional image proof or badge
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// UserHighlight represents a video highlight (like a YouTube or TikTok link).
type UserHighlight struct {
	ID        int64
	UserID    int64
	Title     string // e.g., "Savage Game 3 vs Team B"
	VideoURL  string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// UserProfileRepository defines persistence methods for the user profile entities.
type UserProfileRepository interface {
	// UserStat
	CreateStat(ctx context.Context, stat *UserStat) error
	UpdateStat(ctx context.Context, stat *UserStat) error
	DeleteStat(ctx context.Context, id int64) error
	GetStatByID(ctx context.Context, id int64) (*UserStat, error)
	GetStatsByUserID(ctx context.Context, userID int64) ([]*UserStat, error)

	// UserSocialMedia
	CreateSocialMedia(ctx context.Context, sm *UserSocialMedia) error
	UpdateSocialMedia(ctx context.Context, sm *UserSocialMedia) error
	DeleteSocialMedia(ctx context.Context, id int64) error
	GetSocialMediaByID(ctx context.Context, id int64) (*UserSocialMedia, error)
	GetSocialMediasByUserID(ctx context.Context, userID int64) ([]*UserSocialMedia, error)

	// UserAchievement
	CreateAchievement(ctx context.Context, ach *UserAchievement) error
	UpdateAchievement(ctx context.Context, ach *UserAchievement) error
	DeleteAchievement(ctx context.Context, id int64) error
	GetAchievementByID(ctx context.Context, id int64) (*UserAchievement, error)
	GetAchievementsByUserID(ctx context.Context, userID int64) ([]*UserAchievement, error)

	// UserHighlight
	CreateHighlight(ctx context.Context, hl *UserHighlight) error
	UpdateHighlight(ctx context.Context, hl *UserHighlight) error
	DeleteHighlight(ctx context.Context, id int64) error
	GetHighlightByID(ctx context.Context, id int64) (*UserHighlight, error)
	GetHighlightsByUserID(ctx context.Context, userID int64) ([]*UserHighlight, error)
}

// UserProfileUsecase defines the business logic interface for profile enrichment.
type UserProfileUsecase interface {
	// UserStat
	CreateStat(ctx context.Context, userID int64, input UserStat) (*UserStat, error)
	UpdateStat(ctx context.Context, userID, id int64, input UserStat) (*UserStat, error)
	DeleteStat(ctx context.Context, userID, id int64) error

	// UserSocialMedia
	CreateSocialMedia(ctx context.Context, userID int64, input UserSocialMedia) (*UserSocialMedia, error)
	UpdateSocialMedia(ctx context.Context, userID, id int64, input UserSocialMedia) (*UserSocialMedia, error)
	DeleteSocialMedia(ctx context.Context, userID, id int64) error

	// UserAchievement
	CreateAchievement(ctx context.Context, userID int64, input UserAchievement) (*UserAchievement, error)
	UpdateAchievement(ctx context.Context, userID, id int64, input UserAchievement) (*UserAchievement, error)
	DeleteAchievement(ctx context.Context, userID, id int64) error

	// UserHighlight
	CreateHighlight(ctx context.Context, userID int64, input UserHighlight) (*UserHighlight, error)
	UpdateHighlight(ctx context.Context, userID, id int64, input UserHighlight) (*UserHighlight, error)
	DeleteHighlight(ctx context.Context, userID, id int64) error
}
