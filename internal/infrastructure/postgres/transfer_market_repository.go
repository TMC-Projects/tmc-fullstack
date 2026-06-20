package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type transferMarketRepository struct {
	db *gorm.DB
}

// NewTransferMarketRepository creates a new instance of domain.TransferMarketRepository.
func NewTransferMarketRepository(db *gorm.DB) domain.TransferMarketRepository {
	return &transferMarketRepository{db: db}
}

// Create inserts a new transfer market entry.
func (r *transferMarketRepository) Create(ctx context.Context, entry *domain.TransferMarket) error {
	m := &TransferMarketModel{
		UserID: entry.UserID,
		Status: entry.Status,
	}
	if err := r.db.WithContext(ctx).Create(m).Error; err != nil {
		return err
	}
	entry.ID = m.ID
	entry.CreatedAt = m.CreatedAt
	entry.UpdatedAt = m.UpdatedAt
	return nil
}

// GetByUserID fetches the transfer market entry for a specific user.
func (r *transferMarketRepository) GetByUserID(ctx context.Context, userID int64) (*domain.TransferMarket, error) {
	var m TransferMarketModel
	err := r.db.WithContext(ctx).
		Preload("User").
		Where("user_id = ?", userID).
		First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

// GetList returns a paginated list of transfer market entries with optional status filter.
// Returns (entries, totalCount, error).
func (r *transferMarketRepository) GetList(ctx context.Context, filter domain.TransferMarketFilter) ([]domain.TransferMarket, int64, error) {
	var models []TransferMarketModel
	var total int64

	query := r.db.WithContext(ctx).Model(&TransferMarketModel{}).
		Joins("JOIN users ON users.id = transfer_market.user_id").
		Where("users.category NOT IN ?", []string{"owner", "ba"}).
		Where("transfer_market.status != ?", domain.TransferStatusClosed)

	// Apply status filter if specified
	if filter.Status != "" {
		query = query.Where("transfer_market.status = ?", filter.Status)
	}

	if filter.Search != "" {
		searchTerm := "%" + filter.Search + "%"
		query = query.Where(
			"users.full_name ILIKE ? OR TO_CHAR(users.created_at, 'YYYY-MM-DD') ILIKE ? OR TO_CHAR(users.contract_until, 'YYYY-MM-DD') ILIKE ?",
			searchTerm, searchTerm, searchTerm,
		)
	}

	// Count total matching records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and preload User data
	offset := (filter.Page - 1) * filter.Limit
	err := query.
		Preload("User").
		Preload("User.Club").
		Preload("User.Stats").
		Preload("User.SocialMedias").
		Preload("User.Achievements").
		Preload("User.Highlights").
		Order("transfer_market.created_at DESC").
		Offset(offset).
		Limit(filter.Limit).
		Find(&models).Error
	if err != nil {
		return nil, 0, err
	}

	entries := make([]domain.TransferMarket, len(models))
	for i := range models {
		entries[i] = *models[i].ToDomain()
	}
	return entries, total, nil
}

// UpdateStatus changes the status of a transfer market entry by its ID.
func (r *transferMarketRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	result := r.db.WithContext(ctx).
		Model(&TransferMarketModel{}).
		Where("id = ?", id).
		Update("status", status)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return errors.New("transfer market entry not found")
	}
	return nil
}
