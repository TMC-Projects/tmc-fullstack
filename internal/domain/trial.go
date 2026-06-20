package domain

import (
	"context"
	"time"
)

// Trial status constants.
const (
	TrialStatusDraft     = "DRAFT"
	TrialStatusPublished = "PUBLISHED"
	TrialStatusClosed    = "CLOSED"
	TrialStatusCompleted = "COMPLETED"
)

// Trial represents an esport trial/tryout session announced by a club.
type Trial struct {
	ID              int64
	ClubID          int64
	Club            *Club
	GameID          int64
	Game            *Game
	Title           string
	Description     string
	StartDate       time.Time
	EndDate         time.Time
	MaxParticipants int    // 0 = unlimited
	Status          string // DRAFT | PUBLISHED | CLOSED | COMPLETED
	CreatedBy       int64
	CreatedAt       time.Time
	UpdatedAt       time.Time
}

// TrialFilter defines optional filters when listing trials.
type TrialFilter struct {
	Status string
	ClubID int64
	GameID int64
	Page   int
	Limit  int
}

// CreateTrialInput holds the input for creating a trial.
type CreateTrialInput struct {
	GameID          int64
	Title           string
	Description     string
	StartDate       time.Time
	EndDate         time.Time
	MaxParticipants int
}

// UpdateTrialInput holds the input for updating a trial.
type UpdateTrialInput struct {
	Title           string
	Description     string
	GameID          int64
	StartDate       time.Time
	EndDate         time.Time
	MaxParticipants int
	Status          string
}

// TrialRepository defines the outbound port for Trial persistence.
type TrialRepository interface {
	Create(ctx context.Context, trial *Trial) error
	Update(ctx context.Context, trial *Trial) error
	GetByID(ctx context.Context, id int64) (*Trial, error)
	GetList(ctx context.Context, filter TrialFilter) ([]*Trial, int64, error)
}

// TrialUsecase defines the inbound port for Trial business logic.
type TrialUsecase interface {
	CreateTrial(ctx context.Context, input CreateTrialInput, callerUserID int64) (*Trial, error)
	UpdateTrial(ctx context.Context, trialID int64, input UpdateTrialInput, callerUserID int64) (*Trial, error)
	GetTrials(ctx context.Context, filter TrialFilter) ([]*Trial, int64, error)
	GetTrialByID(ctx context.Context, id int64) (*Trial, error)
}
