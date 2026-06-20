package postgres

import (
	"context"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type accessLogRepository struct {
	db *gorm.DB
}

// NewAccessLogRepository creates a new instance of AccessLogRepository.
func NewAccessLogRepository(db *gorm.DB) domain.AccessLogRepository {
	return &accessLogRepository{db: db}
}

func (r *accessLogRepository) Create(ctx context.Context, log *domain.AccessLog) error {
	model := AccessLogFromDomain(log)
	return r.db.WithContext(ctx).Create(model).Error
}

func (r *accessLogRepository) GetList(ctx context.Context, filter domain.AccessLogFilter) ([]*domain.AccessLog, int64, error) {
	var models []AccessLogModel
	var total int64

	query := r.db.WithContext(ctx).Model(&AccessLogModel{})

	// Count total records
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Apply pagination and sorting
	offset := (filter.Page - 1) * filter.Limit
	if err := query.Order("created_at DESC").Offset(offset).Limit(filter.Limit).Find(&models).Error; err != nil {
		return nil, 0, err
	}

	logs := make([]*domain.AccessLog, len(models))
	for i, m := range models {
		logs[i] = m.ToDomain()
	}

	return logs, total, nil
}
