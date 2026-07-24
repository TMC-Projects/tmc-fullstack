package domain

import (
	"context"
	"time"
)

// TrialApplication status constants.
const (
	ApplicationStatusApplied     = "APPLIED"
	ApplicationStatusShortlisted = "SHORTLISTED"
	ApplicationStatusRejected    = "REJECTED"
	ApplicationStatusWithdrawn   = "WITHDRAWN"
	ApplicationStatusSigned      = "SIGNED"
)

// TrialApplication represents a player's application to a trial.
type TrialApplication struct {
	ID         int64
	TrialID    int64
	Trial      *Trial
	PlayerID   int64
	Player     *User
	Status     string // APPLIED | SHORTLISTED | REJECTED | WITHDRAWN
	AppliedAt  time.Time
	ReviewedAt *time.Time
	ReviewedBy *int64
	Remarks    string
	CreatedAt  time.Time
	UpdatedAt  time.Time
	// Extra fields for frontend
	AssessmentScore *float64 `json:"AssessmentScore,omitempty" gorm:"-"`
	FinalResult     string   `json:"FinalResult,omitempty" gorm:"-"`
}

// TrialApplicationRepository defines the outbound port for TrialApplication persistence.
type TrialApplicationRepository interface {
	Create(ctx context.Context, app *TrialApplication) error
	Update(ctx context.Context, app *TrialApplication) error
	GetByID(ctx context.Context, id int64) (*TrialApplication, error)
	GetByTrialAndPlayer(ctx context.Context, trialID, playerID int64) (*TrialApplication, error)
	GetByTrialID(ctx context.Context, trialID int64) ([]*TrialApplication, error)
	GetByPlayerID(ctx context.Context, playerID int64) ([]*TrialApplication, error)
	CountByTrialAndStatus(ctx context.Context, trialID int64, status string) (int64, error)
}

// TrialApplicationUsecase defines the inbound port for application business logic.
type TrialApplicationUsecase interface {
	Apply(ctx context.Context, trialID int64, callerUserID int64) (*TrialApplication, error)
	GetApplicationsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*TrialApplication, error)
	Shortlist(ctx context.Context, applicationID int64, remarks string, callerUserID int64) (*TrialApplication, error)
	Reject(ctx context.Context, applicationID int64, remarks string, callerUserID int64) (*TrialApplication, error)
	GetMyApplications(ctx context.Context, callerUserID int64) ([]*TrialApplication, error)
	GetAssessmentDetail(ctx context.Context, applicationID int64, callerUserID int64) (*AssessmentDetail, error)
}

// AssessmentDetail holds the full assessment result for an application.
type AssessmentDetail struct {
	Application *TrialApplication
	Assessment  *AssessmentResult
	Scores      []*AssessmentScore
}
