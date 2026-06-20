package domain

import (
	"context"
	"time"
)

// RegisterTalentInput represents the payload for registering a new talent directly into a club.
type RegisterTalentInput struct {
	Username            string     `json:"username" validate:"required"`
	Email               string     `json:"email" validate:"required,email"`
	Password            string     `json:"password" validate:"required,min=8"`
	FullName            string     `json:"full_name" validate:"required"`
	Category            string     `json:"category" validate:"required,oneof=player coach staff ba manager asst_coach"`
	ContractUntil       *time.Time `json:"contract_until"`
	Salary              *int64     `json:"salary"`
	ReleaseClauseEnable bool       `json:"release_clause_enable"`
	ReleaseClauseAmount *int64     `json:"release_clause_amount"`
}

// UpdateTalentBiodataInput represents the payload for editing a talent's biodata.
type UpdateTalentBiodataInput struct {
	FullName string `json:"full_name" validate:"required"`
	Username string `json:"username" validate:"required"`
	Email    string `json:"email" validate:"required,email"`
	Category string `json:"category" validate:"required,oneof=player coach staff ba manager asst_coach"`
	Bio      string `json:"bio"`
}

// TalentFilter defines the query parameters for filtering the talent list.
type TalentFilter struct {
	Search         string // Search by full_name or username (case-insensitive)
	Category       string // Filter by user category: "player", "coach", "staff", "ba"
	TransferStatus string // Filter by transfer market status: "available", "transferred", "" = all
	Page           int    // 1-indexed
	Limit          int    // Items per page (default 10)
	CallerUserID   int64  // Used to determine visibility of sensitive fields like MarketValue
	CallerClubID   int64  // Used to filter talents by the caller's club
	TeamID         *int64 // Used to filter talents by a specific team
}

// TalentResult represents a single talent enriched with transfer market status.
type TalentResult struct {
	ID             int64      `json:"id"`
	Username       string     `json:"username"`
	FullName       string     `json:"full_name"`
	Email          string     `json:"email"`
	Category       string     `json:"category"`
	ClubID         int64      `json:"club_id"`
	TeamID         *int64     `json:"team_id"`
	Bio            string     `json:"bio"`
	Status         string     `json:"status"`
	ContractUntil  *time.Time `json:"contract_until"`
	Salary         *int64     `json:"salary"`
	MarketValue    *int64     `json:"market_value"`    // nil when caller is not owner/manager
	TransferStatus string     `json:"transfer_status"` // "available" | "transferred" | "not_listed"
	ProfilePictureUrl string     `json:"profile_picture_url"`
	CreatedAt      time.Time  `json:"created_at"`
}

// PaginatedTalents holds a paginated list of talent results.
type PaginatedTalents struct {
	Data       []*TalentResult `json:"data"`
	Total      int64           `json:"total"`
	Page       int             `json:"page"`
	Limit      int             `json:"limit"`
	TotalPages int             `json:"total_pages"`
}

// TalentUsecase defines the interface for talent registration business logic.
type TalentUsecase interface {
	RegisterTalent(ctx context.Context, creatorUserID int64, input RegisterTalentInput) (*User, error)
	GetTalents(ctx context.Context, filter TalentFilter) (*PaginatedTalents, error)
	UpdateTalentBiodata(ctx context.Context, targetUserID int64, input UpdateTalentBiodataInput, callerUserID int64) error
	UpdateMarketValue(ctx context.Context, targetUserID int64, value *int64, callerUserID int64) error
	UpdateContractAndSalary(ctx context.Context, targetUserID int64, contractUntil *time.Time, salary *int64, callerUserID int64) error
	UpdateProfilePicture(ctx context.Context, targetUserID int64, url string, callerUserID int64) error
	UpdateStatus(ctx context.Context, targetUserID int64, status string, callerUserID int64) error
	SignFreeAgent(ctx context.Context, targetUserID int64, callerUserID int64) error
}
