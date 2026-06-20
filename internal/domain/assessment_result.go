package domain

import (
	"context"
	"time"
)

// AssessmentResult recommendation constants.
const (
	RecommendationHighlyRecommended = "HIGHLY_RECOMMENDED"
	RecommendationRecommended       = "RECOMMENDED"
	RecommendationPotential         = "POTENTIAL"
	RecommendationNotRecommended    = "NOT_RECOMMENDED"
)

// AssessmentResult represents a coach's or staff's evaluation of a trial participant.
// One participant can have multiple assessments from different assessors.
type AssessmentResult struct {
	ID             int64
	TrialID        int64
	Trial          *Trial
	ParticipantID  int64
	Participant    *TrialParticipant
	AssessorID     int64
	Assessor       *User
	TotalScore     float64 // Calculated automatically from AssessmentScores using weighted formula
	Recommendation string  // HIGHLY_RECOMMENDED | RECOMMENDED | POTENTIAL | NOT_RECOMMENDED
	Summary        string
	CreatedAt      time.Time
	UpdatedAt      time.Time
}

// CreateAssessmentInput holds the input for creating an assessment.
type CreateAssessmentInput struct {
	ParticipantID  int64
	Recommendation string
	Summary        string
}

// AssessmentResultRepository defines the outbound port for AssessmentResult persistence.
type AssessmentResultRepository interface {
	Create(ctx context.Context, r *AssessmentResult) error
	Update(ctx context.Context, r *AssessmentResult) error
	GetByID(ctx context.Context, id int64) (*AssessmentResult, error)
	GetByParticipantID(ctx context.Context, participantID int64) ([]*AssessmentResult, error)
}

// AssessmentResultUsecase defines the inbound port for assessment business logic.
type AssessmentResultUsecase interface {
	CreateAssessment(ctx context.Context, input CreateAssessmentInput, callerUserID int64) (*AssessmentResult, error)
	GetAssessmentsByParticipant(ctx context.Context, participantID int64, callerUserID int64) ([]*AssessmentResult, error)
}
