package postgres

import (
	"context"
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type teamRepository struct {
	db *gorm.DB
}

func NewTeamRepository(db *gorm.DB) domain.TeamRepository {
	return &teamRepository{db: db}
}

func (r *teamRepository) Create(ctx context.Context, team *domain.Team) error {
	model := TeamFromDomain(team)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*team = *model.ToDomain()
	return nil
}

func (r *teamRepository) Update(ctx context.Context, team *domain.Team) error {
	model := TeamFromDomain(team)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return err
	}
	*team = *model.ToDomain()
	return nil
}

func (r *teamRepository) GetByID(ctx context.Context, id int64) (*domain.Team, error) {
	var model TeamModel
	err := r.db.WithContext(ctx).
		Preload("Club").
		Preload("Game").
		First(&model, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.NewAppError(domain.ErrCodeNotFound, "Team not found", nil)
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *teamRepository) GetByClubID(ctx context.Context, clubID int64) ([]*domain.Team, error) {
	var models []TeamModel
	err := r.db.WithContext(ctx).
		Where("club_id = ?", clubID).
		Preload("Club").
		Preload("Game").
		Order("created_at desc").
		Find(&models).Error
	if err != nil {
		return nil, err
	}

	var teams []*domain.Team
	for _, m := range models {
		teams = append(teams, m.ToDomain())
	}
	return teams, nil
}

func (r *teamRepository) Delete(ctx context.Context, id int64) error {
	if err := r.db.WithContext(ctx).Delete(&TeamModel{}, id).Error; err != nil {
		return err
	}
	// Also clear team_id from users who belonged to this team
	if err := r.db.WithContext(ctx).Model(&UserModel{}).Where("team_id = ?", id).Update("team_id", nil).Error; err != nil {
		return err
	}
	return nil
}
