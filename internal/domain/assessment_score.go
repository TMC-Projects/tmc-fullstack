package domain

import (
	"context"
	"time"
)

// AssessmentScore represents one score entry for a specific criteria within an assessment.
type AssessmentScore struct {
	ID                 int64
	AssessmentResultID int64
	AssessmentResult   *AssessmentResult
	CriteriaID         int64
	Criteria           *AssessmentCriteria
	Score              int // Valid range: 1-100
	Note               string
	CreatedAt          time.Time
	UpdatedAt          time.Time
}

// ScoreInput represents a single score entry from the HTTP request.
type ScoreInput struct {
	CriteriaID int64  `json:"criteria_id"`
	Score      int    `json:"score"`
	Note       string `json:"note"`
}

// AssessmentScoreRepository defines the outbound port for AssessmentScore persistence.
type AssessmentScoreRepository interface {
	BulkCreate(ctx context.Context, scores []*AssessmentScore) error
	GetByAssessmentID(ctx context.Context, assessmentID int64) ([]*AssessmentScore, error)
}

// AssessmentScoreUsecase defines the inbound port for score business logic.
// Adding scores triggers an automatic recalculation of AssessmentResult.TotalScore.
type AssessmentScoreUsecase interface {
	AddScores(ctx context.Context, assessmentID int64, scores []ScoreInput, callerUserID int64) ([]*AssessmentScore, error)
	GetScores(ctx context.Context, assessmentID int64, callerUserID int64) ([]*AssessmentScore, error)
}
