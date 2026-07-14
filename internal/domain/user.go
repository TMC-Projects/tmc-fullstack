package domain

import (
	"context"
	"time"
)

// User represents the player / user entity in the B2C platform.
type User struct {
	ID           int64
	Username     string
	Email        string
	PasswordHash string
	FullName     string
	Language     string // Default "en", supports "id", "en"
	Bio          string

	ClubID        int64  // Default is "Free Agent" club ID
	Club          *Club  // Preloaded club information
	TeamID        *int64 // Optional, the team this user belongs to within the club
	Team          *Team  // Preloaded team information
	Category      string // "player", "coach", "manager", "owner", "staff", "ba"
	ContractUntil *time.Time
	Salary        *int64
	MarketValue   *int64 // Only applicable for player and coach; visible only to owner/manager
	ReleaseClauseEnable bool
	ReleaseClauseAmount *int64
	VoteCount     int64

	Stats         []UserStat        // Relational
	Achievements  []UserAchievement // Relational
	Highlights    []UserHighlight   // Relational
	SocialMedias  []UserSocialMedia // Relational
	ProfilePictureUrl string
	Blocked       bool
	Status        string // "active" or "inactive"
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// UserRepository defines the outbound port for User database persistence.
type UserRepository interface {
	Create(ctx context.Context, user *User) error
	GetByID(ctx context.Context, id int64) (*User, error)
	GetByEmail(ctx context.Context, email string) (*User, error)
	GetByUsername(ctx context.Context, username string) (*User, error)
	GetByCategoryAndClub(ctx context.Context, category string, clubID int64) ([]*User, error)
	UpdateClubID(ctx context.Context, userID int64, clubID int64) error
	UpdateTeamID(ctx context.Context, userID int64, teamID *int64) error
	GetTalents(ctx context.Context, filter TalentFilter) ([]*TalentResult, int64, error)
	UpdateMarketValue(ctx context.Context, userID int64, value *int64) error
	UpdateContractAndSalary(ctx context.Context, userID int64, contractUntil *time.Time, salary *int64) error
	UpdateProfile(ctx context.Context, user *User) error
	UpdateProfilePicture(ctx context.Context, userID int64, url string) error
	UpdateStatus(ctx context.Context, userID int64, status string) error
	UpdatePassword(ctx context.Context, userID int64, hash string) error
}

// RegisterInput defines the input parameters required to register a user.
type RegisterInput struct {
	Username     string
	Email        string
	Password     string
	FullName     string
	Language     string // default "en", supports "id", "en"
	Bio           string
	Category      string // "player", "coach", "manager", "owner", "staff", "ba"
	ContractUntil *time.Time
	Salary        *int64
}

// LoginInput defines the input parameters required to log a user in.
type LoginInput struct {
	Email    string
	Password string
}

// UpdateProfileInput defines the input parameters for updating main profile.
type UpdateProfileInput struct {
	FullName string
	Bio      string
	Language string
}

// AuthResponse returns the authenticated token and user entity.
type AuthResponse struct {
	Token        string
	RefreshToken string
	User         *User
}

// AuthUsecase defines the inbound port for authentication operations.
type AuthUsecase interface {
	Register(ctx context.Context, input RegisterInput) (*AuthResponse, error)
	Login(ctx context.Context, input LoginInput) (*AuthResponse, error)
	GetProfile(ctx context.Context, userID int64) (*User, error)
	GetProfileByUsername(ctx context.Context, username string) (*User, error)
	RefreshToken(ctx context.Context, refreshToken string) (*AuthResponse, error)
	Logout(ctx context.Context, token string) error
	IsTokenBlocked(ctx context.Context, token string) bool
	UpdateProfile(ctx context.Context, userID int64, input UpdateProfileInput) (*User, error)
	UpdateProfilePicture(ctx context.Context, userID int64, url string) error
	InvalidateProfileCache(ctx context.Context, userID int64) error
	ChangePassword(ctx context.Context, userID int64, oldPassword, newPassword string) error
}

// RolePermissionRepository defines the outbound port for role permission mappings.
type RolePermissionRepository interface {
	GetPermissionsByCategory(ctx context.Context, category string) ([]string, error)
}
