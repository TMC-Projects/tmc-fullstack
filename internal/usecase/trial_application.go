package usecase

import (
	"context"
	"time"
	"fmt"

	"njara-platform/internal/domain"
)

type trialApplicationUsecase struct {
	appRepo         domain.TrialApplicationRepository
	trialRepo       domain.TrialRepository
	participantRepo domain.TrialParticipantRepository
	userRepo        domain.UserRepository
	b2cSubRepo      domain.B2CSubscriptionRepository
	notifUsecase    domain.NotificationUsecase
}

func NewTrialApplicationUsecase(
	appRepo domain.TrialApplicationRepository,
	trialRepo domain.TrialRepository,
	participantRepo domain.TrialParticipantRepository,
	userRepo domain.UserRepository,
	b2cSubRepo domain.B2CSubscriptionRepository,
	notifUsecase domain.NotificationUsecase,
) domain.TrialApplicationUsecase {
	return &trialApplicationUsecase{
		appRepo: appRepo, trialRepo: trialRepo,
		participantRepo: participantRepo, userRepo: userRepo,
		b2cSubRepo: b2cSubRepo, notifUsecase: notifUsecase,
	}
}

// Apply allows a player to apply to a PUBLISHED trial.
func (u *trialApplicationUsecase) Apply(ctx context.Context, trialID int64, callerUserID int64) (*domain.TrialApplication, error) {
	user, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", nil)
	}
	if user.Category != "player" {
		return nil, forbiddenErr("only players can apply to a trial")
	}

	trial, err := u.trialRepo.GetByID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.Status == domain.TrialStatusClosed || trial.Status == domain.TrialStatusCompleted {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, "trial is not accepting applications", nil)
	}
	if trial.Status != domain.TrialStatusPublished {
		return nil, domain.NewAppError(domain.ErrCodeBadRequest, "trial is not published yet", nil)
	}

	// Check for duplicate application
	existing, err := u.appRepo.GetByTrialAndPlayer(ctx, trialID, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check existing application", err)
	}
	if existing != nil {
		return nil, domain.NewAppError(domain.ErrCodeConflict, "you have already applied to this trial", nil)
	}

	// Enforce limit for free users (max 3 active applications)
	if u.b2cSubRepo != nil {
		isPremium, err := u.b2cSubRepo.IsUserPremium(ctx, callerUserID)
		if err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check premium status", err)
		}
		if !isPremium {
			myApps, err := u.appRepo.GetByPlayerID(ctx, callerUserID)
			if err != nil {
				return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check existing applications", err)
			}
			now := time.Now()
			startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
			
			countThisMonth := 0
			for _, app := range myApps {
				if app.CreatedAt.After(startOfMonth) || app.CreatedAt.Equal(startOfMonth) {
					countThisMonth++
				}
			}

			if countThisMonth >= 3 {
				return nil, domain.NewAppError(domain.ErrCodeForbidden, "free users can only apply to up to 3 open trials per month. Please upgrade to premium.", nil)
			}
		}
	}

	// Check max_participants via shortlisted count
	if trial.MaxParticipants > 0 {
		shortlisted, err := u.appRepo.CountByTrialAndStatus(ctx, trialID, domain.ApplicationStatusShortlisted)
		if err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check participant count", err)
		}
		if shortlisted >= int64(trial.MaxParticipants) {
			return nil, domain.NewAppError(domain.ErrCodeBadRequest, "maximum participants limit has been reached", nil)
		}
	}

	app := &domain.TrialApplication{
		TrialID:   trialID,
		PlayerID:  callerUserID,
		Status:    domain.ApplicationStatusApplied,
		AppliedAt: time.Now(),
	}
	if err := u.appRepo.Create(ctx, app); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to submit application", err)
	}
	return app, nil
}

// GetApplicationsByTrial returns all applications for a trial (management only).
func (u *trialApplicationUsecase) GetApplicationsByTrial(ctx context.Context, trialID int64, callerUserID int64) ([]*domain.TrialApplication, error) {
	user, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if user == nil || !canViewParticipants(user.Category) {
		return nil, forbiddenErr("only owner, manager, staff, or coach can view applications")
	}

	trial, err := u.trialRepo.GetByID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != user.ClubID {
		return nil, forbiddenErr("you cannot access applications from another club's trial")
	}

	apps, err := u.appRepo.GetByTrialID(ctx, trialID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve applications", err)
	}
	return apps, nil
}

// Shortlist moves an application to SHORTLISTED and auto-creates a TrialParticipant.
func (u *trialApplicationUsecase) Shortlist(ctx context.Context, applicationID int64, remarks string, callerUserID int64) (*domain.TrialApplication, error) {
	caller, app, trial, err := u.resolveManagementAction(ctx, applicationID, callerUserID)
	if err != nil {
		return nil, err
	}
	_ = caller

	if app.Status == domain.ApplicationStatusShortlisted {
		return nil, domain.NewAppError(domain.ErrCodeConflict, "application is already shortlisted", nil)
	}

	// Check max participants again before shortlisting
	if trial.MaxParticipants > 0 {
		shortlisted, err := u.appRepo.CountByTrialAndStatus(ctx, trial.ID, domain.ApplicationStatusShortlisted)
		if err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check participant count", err)
		}
		if shortlisted >= int64(trial.MaxParticipants) {
			return nil, domain.NewAppError(domain.ErrCodeBadRequest, "maximum participants limit has been reached", nil)
		}
	}

	now := time.Now()
	app.Status = domain.ApplicationStatusShortlisted
	app.ReviewedAt = &now
	app.ReviewedBy = &callerUserID
	app.Remarks = remarks
	if err := u.appRepo.Update(ctx, app); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update application", err)
	}

	// Prevent duplicate participant
	existing, err := u.participantRepo.GetByApplicationID(ctx, applicationID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check participant", err)
	}
	if existing == nil {
		count, err := u.participantRepo.CountByTrial(ctx, trial.ID)
		if err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to count participants", err)
		}
		participant := &domain.TrialParticipant{
			TrialID:          trial.ID,
			PlayerID:         app.PlayerID,
			ApplicationID:    applicationID,
			ParticipantNo:    int(count) + 1,
			AttendanceStatus: domain.AttendanceAbsent,
			CurrentStage:     domain.StageRound1,
			FinalResult:      domain.FinalResultPending,
			JoinedAt:         now,
		}
		if err := u.participantRepo.Create(ctx, participant); err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to create participant record", err)
		}
	}

	// Trigger Notification
	if u.notifUsecase != nil {
		clubName := "A club"
		if trial.Club != nil {
			clubName = trial.Club.Name
		}
		_ = u.notifUsecase.CreateNotification(ctx, &domain.Notification{
			UserID:    app.PlayerID,
			Title:     "Application Shortlisted",
			Message:   fmt.Sprintf("Your application for '%s' at %s has been shortlisted.", trial.Title, clubName),
			Type:      domain.NotificationTypeTrialStatus,
			RelatedID: trial.ID,
		})
	}

	return app, nil
}

// Reject moves an application to REJECTED status.
func (u *trialApplicationUsecase) Reject(ctx context.Context, applicationID int64, remarks string, callerUserID int64) (*domain.TrialApplication, error) {
	_, app, trial, err := u.resolveManagementAction(ctx, applicationID, callerUserID)
	if err != nil {
		return nil, err
	}

	if app.Status == domain.ApplicationStatusRejected {
		return nil, domain.NewAppError(domain.ErrCodeConflict, "application is already rejected", nil)
	}

	now := time.Now()
	app.Status = domain.ApplicationStatusRejected
	app.ReviewedAt = &now
	app.ReviewedBy = &callerUserID
	app.Remarks = remarks
	if err := u.appRepo.Update(ctx, app); err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to update application", err)
	}

	// Trigger Notification
	if u.notifUsecase != nil {
		clubName := "A club"
		if trial.Club != nil {
			clubName = trial.Club.Name
		}
		_ = u.notifUsecase.CreateNotification(ctx, &domain.Notification{
			UserID:    app.PlayerID,
			Title:     "Application Rejected",
			Message:   fmt.Sprintf("Your application for '%s' at %s has been rejected.", trial.Title, clubName),
			Type:      domain.NotificationTypeTrialStatus,
			RelatedID: trial.ID,
		})
	}

	return app, nil
}

// GetMyApplications returns all applications submitted by the calling player.
func (u *trialApplicationUsecase) GetMyApplications(ctx context.Context, callerUserID int64) ([]*domain.TrialApplication, error) {
	user, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if user == nil {
		return nil, domain.NewAppError(domain.ErrCodeNotFound, "user not found", nil)
	}
	if user.Category != "player" {
		return nil, forbiddenErr("only players can view their own applications")
	}

	apps, err := u.appRepo.GetByPlayerID(ctx, callerUserID)
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve applications", err)
	}
	return apps, nil
}

// resolveManagementAction fetches and validates the application and caller for management actions.
func (u *trialApplicationUsecase) resolveManagementAction(ctx context.Context, applicationID int64, callerUserID int64) (*domain.User, *domain.TrialApplication, *domain.Trial, error) {
	caller, err := u.userRepo.GetByID(ctx, callerUserID)
	if err != nil {
		return nil, nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve user", err)
	}
	if caller == nil || !isTrialManager(caller.Category) {
		return nil, nil, nil, forbiddenErr("only owner, manager, or staff can perform this action")
	}

	app, err := u.appRepo.GetByID(ctx, applicationID)
	if err != nil {
		return nil, nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve application", err)
	}
	if app == nil {
		return nil, nil, nil, domain.NewAppError(domain.ErrCodeNotFound, "application not found", nil)
	}

	trial, err := u.trialRepo.GetByID(ctx, app.TrialID)
	if err != nil {
		return nil, nil, nil, domain.NewAppError(domain.ErrCodeInternal, "failed to retrieve trial", err)
	}
	if trial == nil {
		return nil, nil, nil, domain.NewAppError(domain.ErrCodeNotFound, "trial not found", nil)
	}
	if trial.ClubID != caller.ClubID {
		return nil, nil, nil, forbiddenErr("you cannot manage applications from another club's trial")
	}

	return caller, app, trial, nil
}
