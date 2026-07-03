package http

import (
	"strconv"
	"time"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// TransferMarketHandler coordinates presentation logic for transfer market endpoints.
type TransferMarketHandler struct {
	tmUsecase domain.TransferMarketUsecase
}

// NewTransferMarketHandler creates a new TransferMarketHandler.
func NewTransferMarketHandler(tmu domain.TransferMarketUsecase) *TransferMarketHandler {
	return &TransferMarketHandler{tmUsecase: tmu}
}

// transferMarketPlayerResponse is the embedded player data in the transfer market response.
type transferMarketPlayerResponse struct {
	ID            int64        `json:"id"`
	Username      string       `json:"username"`
	FullName      string       `json:"full_name"`
	Category      string       `json:"category"`
	Language      string       `json:"language"`
	Bio           string       `json:"bio"`
	MarketValue   *int64                   `json:"market_value"`
	ContractUntil *time.Time               `json:"contract_until"`
	Salary        *int64                   `json:"salary"`
	Stats         []domain.UserStat        `json:"stats"`
	Achievements  []domain.UserAchievement `json:"achievements"`
	Highlights    []domain.UserHighlight   `json:"highlights"`
	SocialMedias  []domain.UserSocialMedia `json:"social_medias"`
	ProfilePictureUrl string               `json:"profile_picture_url"`
	VoteCount     int64                    `json:"vote_count"`
	Club          *domain.Club             `json:"club,omitempty"`
}

// transferMarketEntryResponse is the JSON shape of a single transfer market entry.
type transferMarketEntryResponse struct {
	ID                   int64                        `json:"id"`
	UserID               int64                        `json:"user_id"`
	Status               string                       `json:"status"`
	HasPendingInvitation bool                         `json:"has_pending_invitation"`
	Player               transferMarketPlayerResponse `json:"player"`
	ListedAt             string                       `json:"listed_at"`
}

// transferMarketListResponse wraps the paginated list with metadata.
type transferMarketListResponse struct {
	Data  []transferMarketEntryResponse `json:"data"`
	Total int64                         `json:"total"`
	Page  int                           `json:"page"`
	Limit int                           `json:"limit"`
}

// GetList handles GET /api/transfer-market
// Query params:
//   - status: "loan" | "free" | "transfer" | "retired"
//   - search: string to search by name or dates
//   - page: integer >= 1 (default: 1)
//   - limit: integer 1-50 (default: 10)
func (h *TransferMarketHandler) GetList(c *fiber.Ctx) error {
	status := c.Query("status", "") // Empty string means all (except closed)
	search := c.Query("search", "")
	page := parseIntQuery(c.Query("page", "1"), 1)
	limit := parseIntQuery(c.Query("limit", "10"), 10)

	// Validate status value if provided
	if status != "" && status != domain.TransferStatusLoan && status != domain.TransferStatusFree && status != domain.TransferStatusTransfer && status != domain.TransferStatusRetired {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid status", nil)
	}

	callerID, _ := c.Locals("userID").(int64)

	filter := domain.TransferMarketFilter{
		Status:       status,
		Search:       search,
		Page:         page,
		Limit:        limit,
		CallerUserID: callerID,
	}

	entries, total, err := h.tmUsecase.GetList(c.UserContext(), filter)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve transfer market list", err)
	}

	data := make([]transferMarketEntryResponse, len(entries))
	for i, e := range entries {
		entry := transferMarketEntryResponse{
			ID:                   e.ID,
			UserID:               e.UserID,
			Status:               e.Status,
			HasPendingInvitation: e.HasPendingInvitation,
			ListedAt:             e.CreatedAt.UTC().Format("2006-01-02T15:04:05Z"),
		}
		if e.User != nil {
			entry.Player = transferMarketPlayerResponse{
				ID:            e.User.ID,
				Username:      e.User.Username,
				FullName:      e.User.FullName,
				Category:      e.User.Category,
				Language:      e.User.Language,
				Bio:           e.User.Bio,
				ContractUntil: e.User.ContractUntil,
				Salary:        e.User.Salary,
				MarketValue:   e.User.MarketValue,
				Stats:         e.User.Stats,
				Achievements:  e.User.Achievements,
				Highlights:    e.User.Highlights,
				SocialMedias:  e.User.SocialMedias,
				ProfilePictureUrl: e.User.ProfilePictureUrl,
				VoteCount:     e.User.VoteCount,
				Club:          e.User.Club,
			}
		}
		data[i] = entry
	}

	return SendSuccess(c, fiber.StatusOK, "Transfer market retrieved successfully", transferMarketListResponse{
		Data:  data,
		Total: total,
		Page:  page,
		Limit: limit,
	})
}

// parseIntQuery converts a query param string to int, returning the fallback on parse error.
func parseIntQuery(val string, fallback int) int {
	if n, err := strconv.Atoi(val); err == nil && n > 0 {
		return n
	}
	return fallback
}

type updateStatusRequest struct {
	Status string `json:"status" validate:"required,oneof=loan free transfer retired closed"`
}

// UpdateStatus handles PUT /api/transfer-market/:id/status
// Updates or creates a transfer market entry for a specific user.
func (h *TransferMarketHandler) UpdateStatus(c *fiber.Ctx) error {
	callerID, ok := c.Locals("userID").(int64)
	if !ok || callerID == 0 {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}

	targetID, err := c.ParamsInt("id")
	if err != nil || targetID == 0 {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid user id", err)
	}

	var req updateStatusRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	if req.Status != domain.TransferStatusLoan && req.Status != domain.TransferStatusFree && req.Status != domain.TransferStatusTransfer && req.Status != domain.TransferStatusRetired && req.Status != domain.TransferStatusClosed {
		return domain.NewAppError(domain.ErrCodeBadRequest, "status must be one of: loan, free, transfer, retired, closed", nil)
	}

	if err := h.tmUsecase.UpdateStatusByUserID(c.UserContext(), int64(targetID), req.Status, callerID); err != nil {
		return err
	}

	return SendSuccess(c, fiber.StatusOK, "Transfer market status updated successfully", nil)
}
