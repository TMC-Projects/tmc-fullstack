package domain

import (
	"context"
	"time"
)

// AssessmentCriteria represents a scoring dimension used in trial evaluations.
type AssessmentCriteria struct {
	ID          int64
	Name        string
	Weight      float64 // Decimal weight, e.g. 0.20 for 20%. All active weights should sum to 1.0.
	Description string
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

// AssessmentCriteriaRepository defines the outbound port for criteria persistence.
type AssessmentCriteriaRepository interface {
	GetAll(ctx context.Context) ([]*AssessmentCriteria, error)
	GetActive(ctx context.Context) ([]*AssessmentCriteria, error)
	GetByID(ctx context.Context, id int64) (*AssessmentCriteria, error)
	Create(ctx context.Context, c *AssessmentCriteria) error
	GetByName(ctx context.Context, name string) (*AssessmentCriteria, error)
}
