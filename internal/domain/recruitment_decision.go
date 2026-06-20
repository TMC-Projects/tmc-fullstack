package domain

import (
	"context"
	"time"
)

// RecruitmentDecision decision constants.
const (
	DecisionAccepted    = "ACCEPTED"
	DecisionRejected    = "REJECTED"
	DecisionWaitingList = "WAITING_LIST"
)

// RecruitmentDecision represents the final recruitment outcome for a trial participant.
// Only one active decision is allowed per participant.
// Side effects:
//   - ACCEPTED  → sets TrialParticipant.FinalResult = PASSED
//   - REJECTED  → sets TrialParticipant.FinalResult = FAILED
type RecruitmentDecision struct {
	ID            int64
	TrialID       int64
	Trial         *Trial
	ParticipantID int64
	Participant   *TrialParticipant
	DecisionBy    int64
	Decider       *User
	Decision      string // ACCEPTED | REJECTED | WAITING_LIST
	Remarks       string
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// CreateDecisionInput holds the input for creating a recruitment decision.
type CreateDecisionInput struct {
	TrialID       int64
	ParticipantID int64
	Decision      string
	Remarks       string
}

// RecruitmentDecisionRepository defines the outbound port for RecruitmentDecision persistence.
type RecruitmentDecisionRepository interface {
	Create(ctx context.Context, d *RecruitmentDecision) error
	Update(ctx context.Context, d *RecruitmentDecision) error
	GetByParticipantID(ctx context.Context, participantID int64) (*RecruitmentDecision, error)
	GetByTrialID(ctx context.Context, trialID int64) ([]*RecruitmentDecision, error)
}

// RecruitmentDecisionUsecase defines the inbound port for recruitment decision business logic.
type RecruitmentDecisionUsecase interface {
	CreateDecision(ctx context.Context, input CreateDecisionInput, callerUserID int64) (*RecruitmentDecision, error)
	GetDecisionsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*RecruitmentDecision, error)
}
