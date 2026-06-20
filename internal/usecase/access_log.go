package usecase

import (
	"context"
	"math"

	"njara-platform/internal/domain"
)

type accessLogUsecase struct {
	repo domain.AccessLogRepository
}

// NewAccessLogUsecase creates a new instance of AccessLogUsecase.
func NewAccessLogUsecase(repo domain.AccessLogRepository) domain.AccessLogUsecase {
	return &accessLogUsecase{repo: repo}
}

// GetList retrieves paginated access logs.
func (u *accessLogUsecase) GetList(ctx context.Context, filter domain.AccessLogFilter) (*domain.PaginatedAccessLogs, error) {
	if filter.Page < 1 {
		filter.Page = 1
	}
	if filter.Limit < 1 || filter.Limit > 100 {
		filter.Limit = 10
	}

	logs, total, err := u.repo.GetList(ctx, filter)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to fetch access logs", err)
	}

	totalPages := int(math.Ceil(float64(total) / float64(filter.Limit)))
	if totalPages == 0 {
		totalPages = 1
	}

	return &domain.PaginatedAccessLogs{
		Data:       logs,
		Total:      total,
		Page:       filter.Page,
		Limit:      filter.Limit,
		TotalPages: totalPages,
	}, nil
}
