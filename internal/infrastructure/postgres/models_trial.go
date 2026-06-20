package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// ─── Trial ────────────────────────────────────────────────────────────────────

// TrialModel represents the GORM schema for trials table.
type TrialModel struct {
	ID              int64     `gorm:"primaryKey;autoIncrement"`
	ClubID          int64     `gorm:"not null;index"`
	Club            ClubModel `gorm:"foreignKey:ClubID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	GameID          int64     `gorm:"not null;index"`
	Game            GameModel `gorm:"foreignKey:GameID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Title           string    `gorm:"not null;type:varchar(255)"`
	Description     string    `gorm:"type:text"`
	StartDate       time.Time `gorm:"not null;type:timestamp"`
	EndDate         time.Time `gorm:"not null;type:timestamp"`
	MaxParticipants int       `gorm:"not null;default:0"`
	Status          string    `gorm:"not null;type:varchar(50);default:'DRAFT';index"`
	CreatedBy       int64     `gorm:"not null;index"`
	CreatedAt       time.Time `gorm:"not null"`
	UpdatedAt       time.Time `gorm:"not null"`
}

func (TrialModel) TableName() string { return "trials" }

func (m *TrialModel) ToDomain() *domain.Trial {
	if m == nil {
		return nil
	}
	t := &domain.Trial{
		ID: m.ID, ClubID: m.ClubID, GameID: m.GameID,
		Title: m.Title, Description: m.Description,
		StartDate: m.StartDate, EndDate: m.EndDate,
		MaxParticipants: m.MaxParticipants, Status: m.Status,
		CreatedBy: m.CreatedBy, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Club.ID != 0 {
		t.Club = m.Club.ToDomain()
	}
	if m.Game.ID != 0 {
		g := m.Game.ToDomain()
		t.Game = &g
	}
	return t
}

func TrialFromDomain(d *domain.Trial) *TrialModel {
	if d == nil {
		return nil
	}
	return &TrialModel{
		ID: d.ID, ClubID: d.ClubID, GameID: d.GameID,
		Title: d.Title, Description: d.Description,
		StartDate: d.StartDate, EndDate: d.EndDate,
		MaxParticipants: d.MaxParticipants, Status: d.Status,
		CreatedBy: d.CreatedBy, CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── TrialApplication ─────────────────────────────────────────────────────────

// TrialApplicationModel represents the GORM schema for trial_applications table.
type TrialApplicationModel struct {
	ID         int64      `gorm:"primaryKey;autoIncrement"`
	TrialID    int64      `gorm:"not null;uniqueIndex:idx_trial_player_app;index"`
	Trial      TrialModel `gorm:"foreignKey:TrialID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	PlayerID   int64      `gorm:"not null;uniqueIndex:idx_trial_player_app;index"`
	Player     UserModel  `gorm:"foreignKey:PlayerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Status     string     `gorm:"not null;type:varchar(50);default:'APPLIED';index"`
	AppliedAt  time.Time  `gorm:"not null"`
	ReviewedAt *time.Time `gorm:"type:timestamp"`
	ReviewedBy *int64     `gorm:"type:bigint"`
	Remarks    string     `gorm:"type:text"`
	CreatedAt  time.Time  `gorm:"not null"`
	UpdatedAt  time.Time  `gorm:"not null"`
}

func (TrialApplicationModel) TableName() string { return "trial_applications" }

func (m *TrialApplicationModel) ToDomain() *domain.TrialApplication {
	if m == nil {
		return nil
	}
	app := &domain.TrialApplication{
		ID: m.ID, TrialID: m.TrialID, PlayerID: m.PlayerID,
		Status: m.Status, AppliedAt: m.AppliedAt,
		ReviewedAt: m.ReviewedAt, ReviewedBy: m.ReviewedBy,
		Remarks: m.Remarks, CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Trial.ID != 0 {
		app.Trial = m.Trial.ToDomain()
	}
	if m.Player.ID != 0 {
		app.Player = m.Player.ToDomain()
	}
	return app
}

func TrialApplicationFromDomain(d *domain.TrialApplication) *TrialApplicationModel {
	if d == nil {
		return nil
	}
	return &TrialApplicationModel{
		ID: d.ID, TrialID: d.TrialID, PlayerID: d.PlayerID,
		Status: d.Status, AppliedAt: d.AppliedAt,
		ReviewedAt: d.ReviewedAt, ReviewedBy: d.ReviewedBy,
		Remarks: d.Remarks, CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── TrialParticipant ─────────────────────────────────────────────────────────

// TrialParticipantModel represents the GORM schema for trial_participants table.
type TrialParticipantModel struct {
	ID               int64                 `gorm:"primaryKey;autoIncrement"`
	TrialID          int64                 `gorm:"not null;index"`
	Trial            TrialModel            `gorm:"foreignKey:TrialID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	PlayerID         int64                 `gorm:"not null;index"`
	Player           UserModel             `gorm:"foreignKey:PlayerID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ApplicationID    int64                 `gorm:"not null;uniqueIndex"`
	Application      TrialApplicationModel `gorm:"foreignKey:ApplicationID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ParticipantNo    int                   `gorm:"not null"`
	AttendanceStatus string                `gorm:"not null;type:varchar(50);default:'ABSENT'"`
	CurrentStage     string                `gorm:"not null;type:varchar(50);default:'ROUND_1'"`
	FinalResult      string                `gorm:"not null;type:varchar(50);default:'PENDING'"`
	JoinedAt         time.Time             `gorm:"not null"`
	CreatedAt        time.Time             `gorm:"not null"`
	UpdatedAt        time.Time             `gorm:"not null"`
}

func (TrialParticipantModel) TableName() string { return "trial_participants" }

func (m *TrialParticipantModel) ToDomain() *domain.TrialParticipant {
	if m == nil {
		return nil
	}
	p := &domain.TrialParticipant{
		ID: m.ID, TrialID: m.TrialID, PlayerID: m.PlayerID,
		ApplicationID: m.ApplicationID, ParticipantNo: m.ParticipantNo,
		AttendanceStatus: m.AttendanceStatus, CurrentStage: m.CurrentStage,
		FinalResult: m.FinalResult, JoinedAt: m.JoinedAt,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Trial.ID != 0 {
		p.Trial = m.Trial.ToDomain()
	}
	if m.Player.ID != 0 {
		p.Player = m.Player.ToDomain()
	}
	return p
}

func TrialParticipantFromDomain(d *domain.TrialParticipant) *TrialParticipantModel {
	if d == nil {
		return nil
	}
	return &TrialParticipantModel{
		ID: d.ID, TrialID: d.TrialID, PlayerID: d.PlayerID,
		ApplicationID: d.ApplicationID, ParticipantNo: d.ParticipantNo,
		AttendanceStatus: d.AttendanceStatus, CurrentStage: d.CurrentStage,
		FinalResult: d.FinalResult, JoinedAt: d.JoinedAt,
		CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── AssessmentCriteria ───────────────────────────────────────────────────────

// AssessmentCriteriaModel represents the GORM schema for assessment_criteria table.
type AssessmentCriteriaModel struct {
	ID          int64     `gorm:"primaryKey;autoIncrement"`
	Name        string    `gorm:"uniqueIndex;not null;type:varchar(255)"`
	Weight      float64   `gorm:"not null;type:decimal(5,4)"` // e.g. 0.2000 = 20%
	Description string    `gorm:"type:text"`
	IsActive    bool      `gorm:"not null;default:true"`
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

func (AssessmentCriteriaModel) TableName() string { return "assessment_criteria" }

func (m *AssessmentCriteriaModel) ToDomain() *domain.AssessmentCriteria {
	if m == nil {
		return nil
	}
	return &domain.AssessmentCriteria{
		ID: m.ID, Name: m.Name, Weight: m.Weight,
		Description: m.Description, IsActive: m.IsActive,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
}

func AssessmentCriteriaFromDomain(d *domain.AssessmentCriteria) *AssessmentCriteriaModel {
	if d == nil {
		return nil
	}
	return &AssessmentCriteriaModel{
		ID: d.ID, Name: d.Name, Weight: d.Weight,
		Description: d.Description, IsActive: d.IsActive,
		CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── AssessmentResult ─────────────────────────────────────────────────────────

// AssessmentResultModel represents the GORM schema for assessment_results table.
type AssessmentResultModel struct {
	ID             int64                 `gorm:"primaryKey;autoIncrement"`
	TrialID        int64                 `gorm:"not null;index"`
	Trial          TrialModel            `gorm:"foreignKey:TrialID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ParticipantID  int64                 `gorm:"not null;index"`
	Participant    TrialParticipantModel `gorm:"foreignKey:ParticipantID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	AssessorID     int64                 `gorm:"not null;index"`
	Assessor       UserModel             `gorm:"foreignKey:AssessorID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	TotalScore     float64               `gorm:"not null;default:0;type:decimal(6,2)"`
	Recommendation string                `gorm:"not null;type:varchar(50)"`
	Summary        string                `gorm:"type:text"`
	CreatedAt      time.Time             `gorm:"not null"`
	UpdatedAt      time.Time             `gorm:"not null"`
}

func (AssessmentResultModel) TableName() string { return "assessment_results" }

func (m *AssessmentResultModel) ToDomain() *domain.AssessmentResult {
	if m == nil {
		return nil
	}
	r := &domain.AssessmentResult{
		ID: m.ID, TrialID: m.TrialID, ParticipantID: m.ParticipantID,
		AssessorID: m.AssessorID, TotalScore: m.TotalScore,
		Recommendation: m.Recommendation, Summary: m.Summary,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Participant.ID != 0 {
		r.Participant = m.Participant.ToDomain()
	}
	if m.Assessor.ID != 0 {
		r.Assessor = m.Assessor.ToDomain()
	}
	return r
}

func AssessmentResultFromDomain(d *domain.AssessmentResult) *AssessmentResultModel {
	if d == nil {
		return nil
	}
	return &AssessmentResultModel{
		ID: d.ID, TrialID: d.TrialID, ParticipantID: d.ParticipantID,
		AssessorID: d.AssessorID, TotalScore: d.TotalScore,
		Recommendation: d.Recommendation, Summary: d.Summary,
		CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── AssessmentScore ──────────────────────────────────────────────────────────

// AssessmentScoreModel represents the GORM schema for assessment_scores table.
type AssessmentScoreModel struct {
	ID                 int64                   `gorm:"primaryKey;autoIncrement"`
	AssessmentResultID int64                   `gorm:"not null;uniqueIndex:idx_assessment_criteria;index"`
	AssessmentResult   AssessmentResultModel   `gorm:"foreignKey:AssessmentResultID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	CriteriaID         int64                   `gorm:"not null;uniqueIndex:idx_assessment_criteria;index"`
	Criteria           AssessmentCriteriaModel `gorm:"foreignKey:CriteriaID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Score              int                     `gorm:"not null;type:smallint"` // 1-100
	Note               string                  `gorm:"type:text"`
	CreatedAt          time.Time               `gorm:"not null"`
	UpdatedAt          time.Time               `gorm:"not null"`
}

func (AssessmentScoreModel) TableName() string { return "assessment_scores" }

func (m *AssessmentScoreModel) ToDomain() *domain.AssessmentScore {
	if m == nil {
		return nil
	}
	s := &domain.AssessmentScore{
		ID: m.ID, AssessmentResultID: m.AssessmentResultID,
		CriteriaID: m.CriteriaID, Score: m.Score, Note: m.Note,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Criteria.ID != 0 {
		s.Criteria = m.Criteria.ToDomain()
	}
	return s
}

func AssessmentScoreFromDomain(d *domain.AssessmentScore) *AssessmentScoreModel {
	if d == nil {
		return nil
	}
	return &AssessmentScoreModel{
		ID: d.ID, AssessmentResultID: d.AssessmentResultID,
		CriteriaID: d.CriteriaID, Score: d.Score, Note: d.Note,
		CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}

// ─── RecruitmentDecision ──────────────────────────────────────────────────────

// RecruitmentDecisionModel represents the GORM schema for recruitment_decisions table.
type RecruitmentDecisionModel struct {
	ID            int64                 `gorm:"primaryKey;autoIncrement"`
	TrialID       int64                 `gorm:"not null;index"`
	Trial         TrialModel            `gorm:"foreignKey:TrialID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	ParticipantID int64                 `gorm:"not null;uniqueIndex"` // Only one active decision per participant
	Participant   TrialParticipantModel `gorm:"foreignKey:ParticipantID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	DecisionBy    int64                 `gorm:"not null;index"`
	Decider       UserModel             `gorm:"foreignKey:DecisionBy;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Decision      string                `gorm:"not null;type:varchar(50)"`
	Remarks       string                `gorm:"type:text"`
	CreatedAt     time.Time             `gorm:"not null"`
	UpdatedAt     time.Time             `gorm:"not null"`
}

func (RecruitmentDecisionModel) TableName() string { return "recruitment_decisions" }

func (m *RecruitmentDecisionModel) ToDomain() *domain.RecruitmentDecision {
	if m == nil {
		return nil
	}
	d := &domain.RecruitmentDecision{
		ID: m.ID, TrialID: m.TrialID, ParticipantID: m.ParticipantID,
		DecisionBy: m.DecisionBy, Decision: m.Decision, Remarks: m.Remarks,
		CreatedAt: m.CreatedAt, UpdatedAt: m.UpdatedAt,
	}
	if m.Participant.ID != 0 {
		d.Participant = m.Participant.ToDomain()
	}
	if m.Decider.ID != 0 {
		d.Decider = m.Decider.ToDomain()
	}
	return d
}

func RecruitmentDecisionFromDomain(d *domain.RecruitmentDecision) *RecruitmentDecisionModel {
	if d == nil {
		return nil
	}
	return &RecruitmentDecisionModel{
		ID: d.ID, TrialID: d.TrialID, ParticipantID: d.ParticipantID,
		DecisionBy: d.DecisionBy, Decision: d.Decision, Remarks: d.Remarks,
		CreatedAt: d.CreatedAt, UpdatedAt: d.UpdatedAt,
	}
}
