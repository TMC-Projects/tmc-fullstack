package postgres

import (
	"context"
	"errors"

	"njara-platform/internal/domain"
	"gorm.io/gorm"
)

type userProfileRepository struct {
	db *gorm.DB
}

func NewUserProfileRepository(db *gorm.DB) domain.UserProfileRepository {
	return &userProfileRepository{db: db}
}

// ─── Stats ───────────────────────────────────────────────────────────────────

func (r *userProfileRepository) CreateStat(ctx context.Context, stat *domain.UserStat) error {
	model := UserStatFromDomain(stat)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*stat = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) UpdateStat(ctx context.Context, stat *domain.UserStat) error {
	model := UserStatFromDomain(stat)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return err
	}
	*stat = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) DeleteStat(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&UserStatModel{}, id).Error
}

func (r *userProfileRepository) GetStatByID(ctx context.Context, id int64) (*domain.UserStat, error) {
	var model UserStatModel
	if err := r.db.WithContext(ctx).Preload("Game").First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *userProfileRepository) GetStatsByUserID(ctx context.Context, userID int64) ([]*domain.UserStat, error) {
	var models []UserStatModel
	if err := r.db.WithContext(ctx).Preload("Game").Where("user_id = ?", userID).Find(&models).Error; err != nil {
		return nil, err
	}
	var res []*domain.UserStat
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}

// ─── Social Media ────────────────────────────────────────────────────────────

func (r *userProfileRepository) CreateSocialMedia(ctx context.Context, sm *domain.UserSocialMedia) error {
	model := UserSocialMediaFromDomain(sm)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*sm = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) UpdateSocialMedia(ctx context.Context, sm *domain.UserSocialMedia) error {
	model := UserSocialMediaFromDomain(sm)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return err
	}
	*sm = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) DeleteSocialMedia(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&UserSocialMediaModel{}, id).Error
}

func (r *userProfileRepository) GetSocialMediaByID(ctx context.Context, id int64) (*domain.UserSocialMedia, error) {
	var model UserSocialMediaModel
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *userProfileRepository) GetSocialMediasByUserID(ctx context.Context, userID int64) ([]*domain.UserSocialMedia, error) {
	var models []UserSocialMediaModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&models).Error; err != nil {
		return nil, err
	}
	var res []*domain.UserSocialMedia
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}

// ─── Achievements ────────────────────────────────────────────────────────────

func (r *userProfileRepository) CreateAchievement(ctx context.Context, ach *domain.UserAchievement) error {
	model := UserAchievementFromDomain(ach)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*ach = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) UpdateAchievement(ctx context.Context, ach *domain.UserAchievement) error {
	model := UserAchievementFromDomain(ach)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return err
	}
	*ach = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) DeleteAchievement(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&UserAchievementModel{}, id).Error
}

func (r *userProfileRepository) GetAchievementByID(ctx context.Context, id int64) (*domain.UserAchievement, error) {
	var model UserAchievementModel
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *userProfileRepository) GetAchievementsByUserID(ctx context.Context, userID int64) ([]*domain.UserAchievement, error) {
	var models []UserAchievementModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&models).Error; err != nil {
		return nil, err
	}
	var res []*domain.UserAchievement
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}

// ─── Highlights ──────────────────────────────────────────────────────────────

func (r *userProfileRepository) CreateHighlight(ctx context.Context, hl *domain.UserHighlight) error {
	model := UserHighlightFromDomain(hl)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return err
	}
	*hl = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) UpdateHighlight(ctx context.Context, hl *domain.UserHighlight) error {
	model := UserHighlightFromDomain(hl)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return err
	}
	*hl = *model.ToDomain()
	return nil
}

func (r *userProfileRepository) DeleteHighlight(ctx context.Context, id int64) error {
	return r.db.WithContext(ctx).Delete(&UserHighlightModel{}, id).Error
}

func (r *userProfileRepository) GetHighlightByID(ctx context.Context, id int64) (*domain.UserHighlight, error) {
	var model UserHighlightModel
	if err := r.db.WithContext(ctx).First(&model, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *userProfileRepository) GetHighlightsByUserID(ctx context.Context, userID int64) ([]*domain.UserHighlight, error) {
	var models []UserHighlightModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&models).Error; err != nil {
		return nil, err
	}
	var res []*domain.UserHighlight
	for _, m := range models {
		res = append(res, m.ToDomain())
	}
	return res, nil
}
