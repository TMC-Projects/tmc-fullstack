package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// TeamModel represents the GORM schema for teams table.
type TeamModel struct {
	ID          int64     `gorm:"primaryKey;autoIncrement"`
	ClubID      int64     `gorm:"not null;index"`
	Club        ClubModel `gorm:"foreignKey:ClubID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	GameID      int64     `gorm:"not null;index"`
	Game        GameModel `gorm:"foreignKey:GameID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Name        string    `gorm:"not null;type:varchar(255)"`
	Description string    `gorm:"type:text"`
	LogoUrl     string    `gorm:"type:text;default:''"`
	Status      string    `gorm:"not null;type:varchar(50);default:'active'"`
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (TeamModel) TableName() string {
	return "teams"
}

// ToDomain maps database TeamModel to pure domain Team.
func (m *TeamModel) ToDomain() *domain.Team {
	if m == nil {
		return nil
	}
	t := &domain.Team{
		ID:          m.ID,
		ClubID:      m.ClubID,
		GameID:      m.GameID,
		Name:        m.Name,
		Description: m.Description,
		LogoUrl:     m.LogoUrl,
		Status:      m.Status,
		CreatedAt:   m.CreatedAt,
		UpdatedAt:   m.UpdatedAt,
	}
	if m.Club.ID != 0 {
		t.Club = m.Club.ToDomain()
	}
	if m.Game.ID != 0 {
		gameDomain := m.Game.ToDomain()
		t.Game = &gameDomain
	}
	return t
}

// TeamFromDomain maps pure domain Team to database TeamModel.
func TeamFromDomain(d *domain.Team) *TeamModel {
	if d == nil {
		return nil
	}
	return &TeamModel{
		ID:          d.ID,
		ClubID:      d.ClubID,
		GameID:      d.GameID,
		Name:        d.Name,
		Description: d.Description,
		LogoUrl:     d.LogoUrl,
		Status:      d.Status,
		CreatedAt:   d.CreatedAt,
		UpdatedAt:   d.UpdatedAt,
	}
}
