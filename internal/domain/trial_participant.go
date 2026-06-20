package domain

import (
	"context"
	"time"
)

// TrialParticipant attendance status constants.
const (
	AttendancePresent = "PRESENT"
	AttendanceAbsent  = "ABSENT"
	AttendanceNoShow  = "NO_SHOW"
)

// TrialParticipant current stage constants.
const (
	StageRound1 = "ROUND_1"
	StageRound2 = "ROUND_2"
	StageFinal  = "FINAL"
)

// TrialParticipant final result constants.
const (
	FinalResultPending = "PENDING"
	FinalResultPassed  = "PASSED"
	FinalResultFailed  = "FAILED"
)

// TrialParticipant represents a shortlisted player who has become a trial participant.
// Created automatically when a TrialApplication is set to SHORTLISTED.
type TrialParticipant struct {
	ID               int64
	TrialID          int64
	Trial            *Trial
	PlayerID         int64
	Player           *User
	ApplicationID    int64
	Application      *TrialApplication
	ParticipantNo    int    // Sequential number within the trial (1, 2, 3, ...)
	AttendanceStatus string // PRESENT | ABSENT | NO_SHOW
	CurrentStage     string // ROUND_1 | ROUND_2 | FINAL
	FinalResult      string // PENDING | PASSED | FAILED
	JoinedAt         time.Time
	CreatedAt        time.Time
	UpdatedAt        time.Time
}

// TrialParticipantRepository defines the outbound port for TrialParticipant persistence.
type TrialParticipantRepository interface {
	Create(ctx context.Context, p *TrialParticipant) error
	Update(ctx context.Context, p *TrialParticipant) error
	GetByID(ctx context.Context, id int64) (*TrialParticipant, error)
	GetByTrialID(ctx context.Context, trialID int64) ([]*TrialParticipant, error)
	GetByTrialAndPlayer(ctx context.Context, trialID, playerID int64) (*TrialParticipant, error)
	GetByApplicationID(ctx context.Context, applicationID int64) (*TrialParticipant, error)
	CountByTrial(ctx context.Context, trialID int64) (int64, error)
}

// TrialParticipantUsecase defines the inbound port for participant business logic.
type TrialParticipantUsecase interface {
	GetParticipantsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*TrialParticipant, error)
	UpdateAttendance(ctx context.Context, participantID int64, attendance string, callerUserID int64) (*TrialParticipant, error)
	UpdateStage(ctx context.Context, participantID int64, stage string, callerUserID int64) (*TrialParticipant, error)
}
