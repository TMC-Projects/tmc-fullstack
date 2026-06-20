package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// UserStatModel maps the UserStat entity to the user_stats table.
type UserStatModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"not null;index"`
	GameID    int64     `gorm:"not null;index"`
	Game      GameModel `gorm:"foreignKey:GameID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	StatName  string    `gorm:"type:varchar(100);not null"`
	StatValue string    `gorm:"type:varchar(255);not null"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

func (UserStatModel) TableName() string { return "user_stats" }

func (m *UserStatModel) ToDomain() *domain.UserStat {
	if m == nil {
		return nil
	}
	stat := &domain.UserStat{
		ID:        m.ID,
		UserID:    m.UserID,
		GameID:    m.GameID,
		StatName:  m.StatName,
		StatValue: m.StatValue,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.Game.ID != 0 {
		game := m.Game.ToDomain()
		stat.Game = &game
	}
	return stat
}

func UserStatFromDomain(d *domain.UserStat) *UserStatModel {
	if d == nil {
		return nil
	}
	return &UserStatModel{
		ID:        d.ID,
		UserID:    d.UserID,
		GameID:    d.GameID,
		StatName:  d.StatName,
		StatValue: d.StatValue,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

// UserSocialMediaModel maps the UserSocialMedia entity to the user_social_medias table.
type UserSocialMediaModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"not null;index"`
	Platform  string    `gorm:"type:varchar(100);not null"`
	Username  string    `gorm:"type:varchar(255)"`
	URL       string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

func (UserSocialMediaModel) TableName() string { return "user_social_medias" }

func (m *UserSocialMediaModel) ToDomain() *domain.UserSocialMedia {
	if m == nil {
		return nil
	}
	return &domain.UserSocialMedia{
		ID:        m.ID,
		UserID:    m.UserID,
		Platform:  m.Platform,
		Username:  m.Username,
		URL:       m.URL,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func UserSocialMediaFromDomain(d *domain.UserSocialMedia) *UserSocialMediaModel {
	if d == nil {
		return nil
	}
	return &UserSocialMediaModel{
		ID:        d.ID,
		UserID:    d.UserID,
		Platform:  d.Platform,
		Username:  d.Username,
		URL:       d.URL,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

// UserAchievementModel maps the UserAchievement entity to the user_achievements table.
type UserAchievementModel struct {
	ID          int64     `gorm:"primaryKey;autoIncrement"`
	UserID      int64     `gorm:"not null;index"`
	Title       string    `gorm:"type:varchar(255);not null"`
	Description string    `gorm:"type:text"`
	Year        int       `gorm:"type:int"`
	ImageURL    string    `gorm:"type:text"`
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

func (UserAchievementModel) TableName() string { return "user_achievements" }

func (m *UserAchievementModel) ToDomain() *domain.UserAchievement {
	if m == nil {
		return nil
	}
	return &domain.UserAchievement{
		ID:          m.ID,
		UserID:      m.UserID,
		Title:       m.Title,
		Description: m.Description,
		Year:        m.Year,
		ImageURL:    m.ImageURL,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
}

func UserAchievementFromDomain(d *domain.UserAchievement) *UserAchievementModel {
	if d == nil {
		return nil
	}
	return &UserAchievementModel{
		ID:          d.ID,
		UserID:      d.UserID,
		Title:       d.Title,
		Description: d.Description,
		Year:        d.Year,
		ImageURL:    d.ImageURL,
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}
}

// UserHighlightModel maps the UserHighlight entity to the user_highlights table.
type UserHighlightModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"not null;index"`
	Title     string    `gorm:"type:varchar(255);not null"`
	VideoURL  string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

func (UserHighlightModel) TableName() string { return "user_highlights" }

func (m *UserHighlightModel) ToDomain() *domain.UserHighlight {
	if m == nil {
		return nil
	}
	return &domain.UserHighlight{
		ID:        m.ID,
		UserID:    m.UserID,
		Title:     m.Title,
		VideoURL:  m.VideoURL,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

func UserHighlightFromDomain(d *domain.UserHighlight) *UserHighlightModel {
	if d == nil {
		return nil
	}
	return &UserHighlightModel{
		ID:        d.ID,
		UserID:    d.UserID,
		Title:     d.Title,
		VideoURL:  d.VideoURL,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}
