package postgres

import (
	"context"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type teamInvitationRepository struct {
	db *gorm.DB
}

func NewTeamInvitationRepository(db *gorm.DB) domain.TeamInvitationRepository {
	return &teamInvitationRepository{db: db}
}

func (r *teamInvitationRepository) Create(ctx context.Context, invitation *domain.TeamInvitation) error {
	model := &TeamInvitationModel{
		ClubID:   invitation.ClubID,
		TeamID:   invitation.TeamID,
		PlayerID: invitation.PlayerID,
		Status:   invitation.Status,
	}

	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	invitation.ID = model.ID
	invitation.CreatedAt = model.CreatedAt
	invitation.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *teamInvitationRepository) GetByID(ctx context.Context, id int64) (*domain.TeamInvitation, error) {
	var model TeamInvitationModel
	if err := r.db.WithContext(ctx).Preload("Club").Preload("Team").First(&model, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *teamInvitationRepository) GetByPlayerID(ctx context.Context, playerID int64) ([]domain.TeamInvitation, error) {
	var models []TeamInvitationModel
	if err := r.db.WithContext(ctx).
		Preload("Club").Preload("Team").
		Where("player_id = ?", playerID).
		Order("created_at desc").
		Find(&models).Error; err != nil {
		return nil, err
	}

	var results []domain.TeamInvitation
	for _, m := range models {
		results = append(results, *m.ToDomain())
	}
	return results, nil
}

func (r *teamInvitationRepository) GetPendingByPlayerAndClub(ctx context.Context, playerID, clubID int64) (*domain.TeamInvitation, error) {
	var model TeamInvitationModel
	if err := r.db.WithContext(ctx).
		Where("player_id = ? AND club_id = ? AND status = ?", playerID, clubID, "pending").
		First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *teamInvitationRepository) GetPendingPlayerIDsByClub(ctx context.Context, clubID int64) ([]int64, error) {
	var playerIDs []int64
	err := r.db.WithContext(ctx).
		Model(&TeamInvitationModel{}).
		Where("club_id = ? AND status = 'pending'", clubID).
		Pluck("player_id", &playerIDs).Error
	if err != nil {
		return nil, err
	}
	return playerIDs, nil
}

func (r *teamInvitationRepository) UpdateStatus(ctx context.Context, id int64, status string) error {
	return r.db.WithContext(ctx).
		Model(&TeamInvitationModel{}).
		Where("id = ?", id).
		Update("status", status).Error
}

func (r *teamInvitationRepository) RejectAllPendingForPlayer(ctx context.Context, playerID int64, exceptID int64) error {
	return r.db.WithContext(ctx).
		Model(&TeamInvitationModel{}).
		Where("player_id = ? AND status = ? AND id != ?", playerID, "pending", exceptID).
		Update("status", "rejected").Error
}
