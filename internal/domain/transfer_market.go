package domain

import (
	"context"
	"time"
)

// TransferMarketStatus defines the possible states of a transfer market entry.
const (
	TransferStatusLoan     = "loan"
	TransferStatusFree     = "free"
	TransferStatusTransfer = "transfer"
	TransferStatusRetired  = "retired"
	TransferStatusClosed   = "closed"
)

// B2B roles that have access to the transfer market feature.
const (
	CategoryOwner   = "owner"
	CategoryManager = "manager"

	PermissionViewTransferMarket = "view_transfer_market"
)

// TransferMarket represents a player listed in the transfer market.
// A player is automatically listed when they register and belong to the Free Agent club.
type TransferMarket struct {
	ID                   int64
	UserID               int64
	User                 *User  // Enriched player data
	Status               string // "available" | "transferred"
	HasPendingInvitation bool   // Whether the caller's club has already sent an invitation
	CreatedAt            time.Time
	UpdatedAt            time.Time
}

// TransferMarketFilter defines the query parameters for filtering the transfer market list.
type TransferMarketFilter struct {
	Status string // Empty string = all statuses
	Search       string // text to search for
	Page         int    // 1-indexed
	Limit        int    // Max items per page
	CallerUserID int64  // ID of the user requesting the list (0 if public)
}

// TransferMarketRepository defines the outbound port for transfer market persistence.
type TransferMarketRepository interface {
	// Create inserts a new transfer market entry for a player.
	Create(ctx context.Context, entry *TransferMarket) error
	// GetByUserID fetches the transfer market entry for a specific user.
	GetByUserID(ctx context.Context, userID int64) (*TransferMarket, error)
	// GetList returns a paginated list of transfer market entries with optional status filter.
	// Returns (entries, totalCount, error).
	GetList(ctx context.Context, filter TransferMarketFilter) ([]TransferMarket, int64, error)
	// UpdateStatus changes the status of a transfer market entry.
	UpdateStatus(ctx context.Context, id int64, status string) error
	// DeleteByUserID removes a transfer market entry for a specific user.
	DeleteByUserID(ctx context.Context, userID int64) error
}

// TransferMarketUsecase defines the inbound port for transfer market business logic.
type TransferMarketUsecase interface {
	// GetList returns a filtered, paginated list of players on the transfer market.
	GetList(ctx context.Context, filter TransferMarketFilter) ([]TransferMarket, int64, error)
	// UpdateStatusByUserID updates or creates a transfer market entry for a specific user.
	UpdateStatusByUserID(ctx context.Context, targetUserID int64, status string, callerUserID int64) error
}
