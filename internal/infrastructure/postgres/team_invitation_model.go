package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

type TeamInvitationModel struct {
	ID        int64      `gorm:"primaryKey"`
	ClubID    int64      `gorm:"not null"`
	TeamID    *int64     
	PlayerID  int64      `gorm:"not null"`
	Status    string     `gorm:"not null;default:'pending'"` // pending, accepted, rejected
	CreatedAt time.Time
	UpdatedAt time.Time

	// Relations
	Club   *ClubModel   `gorm:"foreignKey:ClubID"`
	Team   *TeamModel   `gorm:"foreignKey:TeamID"`
	Player *UserModel   `gorm:"foreignKey:PlayerID"`
}

func (TeamInvitationModel) TableName() string {
	return "team_invitations"
}

func (m *TeamInvitationModel) ToDomain() *domain.TeamInvitation {
	if m == nil {
		return nil
	}
	domainInv := &domain.TeamInvitation{
		ID:        m.ID,
		ClubID:    m.ClubID,
		TeamID:    m.TeamID,
		PlayerID:  m.PlayerID,
		Status:    m.Status,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}

	if m.Club != nil {
		domainInv.Club = m.Club.ToDomain()
	}
	if m.Team != nil {
		domainInv.Team = m.Team.ToDomain()
	}

	return domainInv
}
