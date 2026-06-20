package usecase

import "njara-platform/internal/domain"

// trialManagementCategories defines roles allowed to manage trials.
var trialManagementCategories = map[string]bool{
	"owner":   true,
	"manager": true,
	"staff":   true,
}

// assessorCategories defines roles allowed to submit assessments.
var assessorCategories = map[string]bool{
	"coach":   true,
	"staff":   true,
	"owner":   true,
	"manager": true,
}

// decisionCategories defines roles allowed to make recruitment decisions.
var decisionCategories = map[string]bool{
	"owner":   true,
	"manager": true,
}

// viewParticipantCategories defines roles allowed to view participants/assessments.
var viewParticipantCategories = map[string]bool{
	"owner":   true,
	"manager": true,
	"staff":   true,
	"coach":   true,
}

func isTrialManager(category string) bool       { return trialManagementCategories[category] }
func isAssessor(category string) bool           { return assessorCategories[category] }
func isDecisionMaker(category string) bool      { return decisionCategories[category] }
func canViewParticipants(category string) bool  { return viewParticipantCategories[category] }

// forbiddenErr returns a standard forbidden AppError.
func forbiddenErr(msg string) *domain.AppError {
	return domain.NewAppError(domain.ErrCodeForbidden, msg, nil)
}
