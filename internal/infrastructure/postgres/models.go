package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

// ClubModel represents the GORM schema for clubs table.
type ClubModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	Name            string     `gorm:"uniqueIndex;not null;type:varchar(255)"`
	Address         string     `gorm:"type:text"`
	Country         string     `gorm:"type:varchar(100)"`
	EstablishedYear int        `gorm:"type:int"`
	Category        string     `gorm:"type:varchar(50);default:'club'"`
	Status          string     `gorm:"type:varchar(50);default:'trial'"`
	Verify          bool       `gorm:"not null;default:false"`
	LogoUrl         string     `gorm:"type:text;default:''"`
	OrganizationName string    `gorm:"type:varchar(255);default:''"`
	NIB             string     `gorm:"type:varchar(50);default:''"`
	NPWP            string     `gorm:"type:varchar(50);default:''"`
	ExpiredDate     *time.Time `gorm:"type:timestamp"`
	CreatedAt       time.Time  `gorm:"not null"`
	UpdatedAt       time.Time  `gorm:"not null"`
	Achievements    []ClubAchievementModel `gorm:"foreignKey:ClubID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

// TableName overrides GORM default table naming conventions.
func (ClubModel) TableName() string {
	return "clubs"
}

// ToDomain maps database ClubModel to pure domain Club.
func (m *ClubModel) ToDomain() *domain.Club {
	if m == nil {
		return nil
	}
	club := &domain.Club{
		ID:              m.ID,
		Name:            m.Name,
		Address:         m.Address,
		Country:         m.Country,
		EstablishedYear: m.EstablishedYear,
		Category:        m.Category,
		Status:          m.Status,
		Verify:          m.Verify,
		LogoUrl:         m.LogoUrl,
		OrganizationName: m.OrganizationName,
		NIB:             m.NIB,
		NPWP:            m.NPWP,
		ExpiredDate:     m.ExpiredDate,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}

	if len(m.Achievements) > 0 {
		for _, a := range m.Achievements {
			club.Achievements = append(club.Achievements, *a.ToDomain())
		}
	}
	return club
}

// ClubFromDomain maps pure domain Club to database ClubModel.
func ClubFromDomain(d *domain.Club) *ClubModel {
	if d == nil {
		return nil
	}
	model := &ClubModel{
		ID:              d.ID,
		Name:            d.Name,
		Address:         d.Address,
		Country:         d.Country,
		EstablishedYear: d.EstablishedYear,
		Category:        d.Category,
		Status:          d.Status,
		Verify:          d.Verify,
		LogoUrl:         d.LogoUrl,
		OrganizationName: d.OrganizationName,
		NIB:             d.NIB,
		NPWP:            d.NPWP,
		ExpiredDate:     d.ExpiredDate,
		CreatedAt:       d.CreatedAt,
		UpdatedAt:       d.UpdatedAt,
	}

	return model
}

// ClubAchievementModel represents the GORM schema for club_achievements table.
type ClubAchievementModel struct {
	ID                int64     `gorm:"primaryKey;autoIncrement"`
	ClubID            int64     `gorm:"not null;index"`
	Title             string    `gorm:"not null;type:varchar(255)"`
	TournamentName    string    `gorm:"not null;type:varchar(255)"`
	GameTitle         string    `gorm:"not null;type:varchar(100)"`
	Placement         string    `gorm:"not null;type:varchar(50)"`
	AchievementDate   time.Time `gorm:"not null"`
	TournamentTier    string    `gorm:"type:varchar(50)"`
	PrizePoolCurrency string    `gorm:"type:varchar(10);default:'IDR'"`
	PrizePoolAmount   *float64  `gorm:"type:decimal(15,2)"`
	EventScale        string    `gorm:"type:varchar(20)"`
	ReferenceUrl      string    `gorm:"type:text"`
	CertificateUrl    string    `gorm:"type:text"`
	CreatedAt         time.Time `gorm:"not null"`
	UpdatedAt         time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (ClubAchievementModel) TableName() string {
	return "club_achievements"
}

// ToDomain maps database ClubAchievementModel to pure domain ClubAchievement.
func (m *ClubAchievementModel) ToDomain() *domain.ClubAchievement {
	if m == nil {
		return nil
	}
	return &domain.ClubAchievement{
		ID:                m.ID,
		ClubID:            m.ClubID,
		Title:             m.Title,
		TournamentName:    m.TournamentName,
		GameTitle:         m.GameTitle,
		Placement:         m.Placement,
		AchievementDate:   m.AchievementDate,
		TournamentTier:    m.TournamentTier,
		PrizePoolCurrency: m.PrizePoolCurrency,
		PrizePoolAmount:   m.PrizePoolAmount,
		EventScale:        m.EventScale,
		ReferenceUrl:      m.ReferenceUrl,
		CertificateUrl:    m.CertificateUrl,
		CreatedAt:         m.CreatedAt,
		UpdatedAt:         m.UpdatedAt,
	}
}

// ClubAchievementFromDomain maps pure domain ClubAchievement to database ClubAchievementModel.
func ClubAchievementFromDomain(d *domain.ClubAchievement) *ClubAchievementModel {
	if d == nil {
		return nil
	}
	return &ClubAchievementModel{
		ID:                d.ID,
		ClubID:            d.ClubID,
		Title:             d.Title,
		TournamentName:    d.TournamentName,
		GameTitle:         d.GameTitle,
		Placement:         d.Placement,
		AchievementDate:   d.AchievementDate,
		TournamentTier:    d.TournamentTier,
		PrizePoolCurrency: d.PrizePoolCurrency,
		PrizePoolAmount:   d.PrizePoolAmount,
		EventScale:        d.EventScale,
		ReferenceUrl:      d.ReferenceUrl,
		CertificateUrl:    d.CertificateUrl,
		CreatedAt:         d.CreatedAt,
		UpdatedAt:         d.UpdatedAt,
	}
}

// UserModel represents the GORM schema for users table.
type UserModel struct {
	ID           int64     `gorm:"primaryKey;autoIncrement"`
	Username     string    `gorm:"uniqueIndex;not null;type:varchar(255)"`
	Email        string    `gorm:"uniqueIndex;not null;type:varchar(255)"`
	PasswordHash string    `gorm:"not null;type:varchar(255)"`
	FullName     string    `gorm:"not null;type:varchar(255)"`
	Language     string    `gorm:"not null;type:varchar(10);default:'en'"`
	Bio          string    `gorm:"not null;type:text;default:''"`
	ClubID        int64      `gorm:"not null;index"`
	Club          ClubModel  `gorm:"foreignKey:ClubID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	TeamID        *int64     `gorm:"index"`
	Team          *TeamModel `gorm:"foreignKey:TeamID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	Category      string     `gorm:"not null;type:varchar(50);default:'player'"`
	ContractUntil *time.Time `gorm:"type:timestamp"`
	Salary        *int64     `gorm:"type:bigint"`
	MarketValue   *int64     `gorm:"type:bigint"` // Only for player/coach; visible to owner/manager only
	ReleaseClauseEnable bool   `gorm:"not null;default:false"`
	ReleaseClauseAmount *int64 `gorm:"type:bigint;default:0"`
	VoteCount     int64     `gorm:"not null;default:0"`
	Stats         []UserStatModel        `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Achievements []UserAchievementModel `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Highlights   []UserHighlightModel   `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	SocialMedias []UserSocialMediaModel `gorm:"foreignKey:UserID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	ProfilePictureUrl string            `gorm:"type:text;default:''"`
	Blocked      bool      `gorm:"not null;default:false"`
	Status       string    `gorm:"type:varchar(20);not null;default:'active'"`
	CreatedAt    time.Time `gorm:"not null"`
	UpdatedAt    time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (UserModel) TableName() string {
	return "users"
}

// ToDomain maps database UserModel to pure domain User.
func (m *UserModel) ToDomain() *domain.User {
	if m == nil {
		return nil
	}
	user := &domain.User{
		ID:           m.ID,
		Username:     m.Username,
		Email:        m.Email,
		PasswordHash: m.PasswordHash,
		FullName:     m.FullName,
		Language:     m.Language,
		Bio:          m.Bio,
		ClubID:       m.ClubID,
		TeamID:       m.TeamID,
		Category:      m.Category,
		ContractUntil: m.ContractUntil,
		Salary:        m.Salary,
		MarketValue:   m.MarketValue,
		ReleaseClauseEnable: m.ReleaseClauseEnable,
		ReleaseClauseAmount: m.ReleaseClauseAmount,
		VoteCount:     m.VoteCount,
		ProfilePictureUrl: m.ProfilePictureUrl,
		Blocked:       m.Blocked,
		Status:        m.Status,
		CreatedAt:     m.CreatedAt,
		UpdatedAt:     m.UpdatedAt,
	}

	// Map Club if preloaded
	if m.Club.ID != 0 {
		user.Club = m.Club.ToDomain()
	}

	// Map Team if preloaded
	if m.Team != nil && m.Team.ID != 0 {
		user.Team = m.Team.ToDomain()
	}

	// Map nested entities if preloaded
	if len(m.Stats) > 0 {
		for _, s := range m.Stats {
			user.Stats = append(user.Stats, *s.ToDomain())
		}
	}
	if len(m.Achievements) > 0 {
		for _, a := range m.Achievements {
			user.Achievements = append(user.Achievements, *a.ToDomain())
		}
	}
	if len(m.Highlights) > 0 {
		for _, h := range m.Highlights {
			user.Highlights = append(user.Highlights, *h.ToDomain())
		}
	}
	if len(m.SocialMedias) > 0 {
		for _, sm := range m.SocialMedias {
			user.SocialMedias = append(user.SocialMedias, *sm.ToDomain())
		}
	}

	return user
}

// UserFromDomain maps pure domain User to database UserModel.
func UserFromDomain(d *domain.User) *UserModel {
	if d == nil {
		return nil
	}
	model := &UserModel{
		ID:           d.ID,
		Username:     d.Username,
		Email:        d.Email,
		PasswordHash: d.PasswordHash,
		FullName:     d.FullName,
		Language:     d.Language,
		Bio:          d.Bio,
		ClubID:       d.ClubID,
		TeamID:       d.TeamID,
		Category:      d.Category,
		ContractUntil: d.ContractUntil,
		Salary:        d.Salary,
		MarketValue:   d.MarketValue,
		ReleaseClauseEnable: d.ReleaseClauseEnable,
		ReleaseClauseAmount: d.ReleaseClauseAmount,
		VoteCount:     d.VoteCount,
		ProfilePictureUrl: d.ProfilePictureUrl,
		Blocked:       d.Blocked,
		Status:        d.Status,
		CreatedAt:     d.CreatedAt,
		UpdatedAt:     d.UpdatedAt,
	}

	if d.Club != nil {
		model.Club = *ClubFromDomain(d.Club)
	}

	if d.Team != nil {
		model.Team = TeamFromDomain(d.Team)
	}

	return model
}

// GameModel represents the GORM schema for games table.
type GameModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	Name      string    `gorm:"uniqueIndex;not null;type:varchar(255)"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (GameModel) TableName() string {
	return "games"
}

// ToDomain maps database GameModel to pure domain Game.
func (m *GameModel) ToDomain() domain.Game {
	if m == nil {
		return domain.Game{}
	}
	return domain.Game{
		ID:        m.ID,
		Name:      m.Name,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
}

// GameFromDomain maps pure domain Game to database GameModel.
func GameFromDomain(d *domain.Game) *GameModel {
	if d == nil {
		return nil
	}
	return &GameModel{
		ID:        d.ID,
		Name:      d.Name,
		CreatedAt: d.CreatedAt,
		UpdatedAt: d.UpdatedAt,
	}
}

// RolePermissionModel represents the GORM schema for role_permissions table.
type RolePermissionModel struct {
	ID         int64  `gorm:"primaryKey;autoIncrement"`
	Category   string `gorm:"uniqueIndex:idx_category_permission;not null;type:varchar(50)"`
	Permission string `gorm:"uniqueIndex:idx_category_permission;not null;type:varchar(100)"`
}

// TableName overrides GORM default table naming conventions.
func (RolePermissionModel) TableName() string {
	return "role_permissions"
}

// TransferMarketModel represents the GORM schema for the transfer_market table.
// A record is created automatically when a new player registers (status: free).
type TransferMarketModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"not null;uniqueIndex"`
	User      UserModel `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Status    string    `gorm:"not null;type:varchar(20);default:'free';index"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (TransferMarketModel) TableName() string {
	return "transfer_market"
}

// ToDomain maps TransferMarketModel to domain.TransferMarket.
func (m *TransferMarketModel) ToDomain() *domain.TransferMarket {
	if m == nil {
		return nil
	}
	tm := &domain.TransferMarket{
		ID:        m.ID,
		UserID:    m.UserID,
		Status:    m.Status,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	// Populate embedded User if preloaded
	if m.User.ID != 0 {
		tm.User = m.User.ToDomain()
	}
	return tm
}

// SubscriptionPlanModel represents the GORM schema for subscription_plans table.
type SubscriptionPlanModel struct {
	ID             int64     `gorm:"primaryKey;autoIncrement"`
	Name           string    `gorm:"uniqueIndex;not null;type:varchar(100)"`
	DurationMonths int       `gorm:"not null"`
	Price          int64     `gorm:"not null"` // Price in IDR
	Discount       int64     `gorm:"not null;default:0"` // Discount in IDR
	Description    string    `gorm:"type:text"`
	IsActive       bool      `gorm:"not null;default:true"`
	CreatedAt      time.Time `gorm:"not null"`
	UpdatedAt      time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (SubscriptionPlanModel) TableName() string {
	return "subscription_plans"
}

// ToDomain maps SubscriptionPlanModel to domain.SubscriptionPlan.
func (m *SubscriptionPlanModel) ToDomain() *domain.SubscriptionPlan {
	if m == nil {
		return nil
	}
	return &domain.SubscriptionPlan{
		ID:             m.ID,
		Name:           m.Name,
		DurationMonths: m.DurationMonths,
		Price:          m.Price,
		Discount:       m.Discount,
		FinalPrice:     m.Price - m.Discount,
		Description:    m.Description,
		IsActive:       m.IsActive,
		CreatedAt:      m.CreatedAt,
		UpdatedAt:      m.UpdatedAt,
	}
}

// SubscriptionPlanFromDomain maps domain.SubscriptionPlan to SubscriptionPlanModel.
func SubscriptionPlanFromDomain(d *domain.SubscriptionPlan) *SubscriptionPlanModel {
	if d == nil {
		return nil
	}
	return &SubscriptionPlanModel{
		ID:             d.ID,
		Name:           d.Name,
		DurationMonths: d.DurationMonths,
		Price:          d.Price,
		Discount:       d.Discount,
		Description:    d.Description,
		IsActive:       d.IsActive,
		CreatedAt:      d.CreatedAt,
		UpdatedAt:      d.UpdatedAt,
	}
}

// SubscriptionModel represents the GORM schema for subscriptions table.
// Designed to be provider-agnostic: supports Midtrans and future PayPal.
type SubscriptionModel struct {
	ID              int64                  `gorm:"primaryKey;autoIncrement"`
	ClubID          int64                  `gorm:"not null;index"`
	Club            ClubModel              `gorm:"foreignKey:ClubID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	UserID          *int64                 `gorm:"index"`
	User            UserModel              `gorm:"foreignKey:UserID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"`
	PlanID          int64                  `gorm:"not null"`
	Plan            SubscriptionPlanModel  `gorm:"foreignKey:PlanID;references:ID;constraint:OnUpdate:CASCADE,OnDelete:RESTRICT;"`
	Status          string                 `gorm:"not null;type:varchar(50);default:'pending';index"`
	Amount          int64                  `gorm:"not null"` // Final amount after discount, in IDR
	PaymentProvider string                 `gorm:"not null;type:varchar(50);default:'midtrans'"`
	PaymentOrderID  string                 `gorm:"uniqueIndex;not null;type:varchar(255)"`
	PaymentToken    string                 `gorm:"type:text;default:''"`
	ProviderPayload string                 `gorm:"not null;type:jsonb;default:'{}'"`
	PaidAt          *time.Time             `gorm:"type:timestamp"`
	ExpiredAt       *time.Time             `gorm:"type:timestamp"`
	CreatedAt       time.Time              `gorm:"not null"`
	UpdatedAt       time.Time              `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (SubscriptionModel) TableName() string {
	return "subscriptions"
}

// ToDomain maps SubscriptionModel to domain.Subscription.
func (m *SubscriptionModel) ToDomain() *domain.Subscription {
	if m == nil {
		return nil
	}
	sub := &domain.Subscription{
		ID:              m.ID,
		ClubID:          m.ClubID,
		UserID:          m.UserID,
		PlanID:          m.PlanID,
		Status:          m.Status,
		Amount:          m.Amount,
		PaymentProvider: m.PaymentProvider,
		PaymentOrderID:  m.PaymentOrderID,
		PaymentToken:    m.PaymentToken,
		ProviderPayload: m.ProviderPayload,
		PaidAt:          m.PaidAt,
		ExpiredAt:       m.ExpiredAt,
		CreatedAt:       m.CreatedAt,
		UpdatedAt:       m.UpdatedAt,
	}
	if m.Club.ID != 0 {
		sub.Club = m.Club.ToDomain()
	}
	if m.Plan.ID != 0 {
		sub.Plan = m.Plan.ToDomain()
	}
	return sub
}

// SubscriptionFromDomain maps domain.Subscription to SubscriptionModel.
func SubscriptionFromDomain(d *domain.Subscription) *SubscriptionModel {
	if d == nil {
		return nil
	}
	return &SubscriptionModel{
		ID:              d.ID,
		ClubID:          d.ClubID,
		UserID:          d.UserID,
		PlanID:          d.PlanID,
		Status:          d.Status,
		Amount:          d.Amount,
		PaymentProvider: d.PaymentProvider,
		PaymentOrderID:  d.PaymentOrderID,
		PaymentToken:    d.PaymentToken,
		ProviderPayload: d.ProviderPayload,
		PaidAt:          d.PaidAt,
		ExpiredAt:       d.ExpiredAt,
		CreatedAt:       d.CreatedAt,
		UpdatedAt:       d.UpdatedAt,
	}
}

// AccessLogModel represents the GORM schema for access_logs table.
type AccessLogModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	RequestID string    `gorm:"type:varchar(100);index"`
	Method    string    `gorm:"type:varchar(20)"`
	Path      string    `gorm:"type:text"`
	IP        string    `gorm:"type:varchar(100)"`
	Status    int       `gorm:"type:int"`
	Latency   int64     `gorm:"type:bigint"`
	UserAgent string    `gorm:"type:text"`
	UserID    *int64    `gorm:"type:bigint;index"`
	Email     string    `gorm:"type:varchar(255)"`
	UserRole  string    `gorm:"type:varchar(50)"`
	CreatedAt time.Time `gorm:"not null;index"`
}

// TableName overrides GORM default table naming conventions.
func (AccessLogModel) TableName() string {
	return "access_logs"
}

// ToDomain maps AccessLogModel to domain.AccessLog.
func (m *AccessLogModel) ToDomain() *domain.AccessLog {
	if m == nil {
		return nil
	}
	return &domain.AccessLog{
		ID:        m.ID,
		RequestID: m.RequestID,
		Method:    m.Method,
		Path:      m.Path,
		IP:        m.IP,
		Status:    m.Status,
		Latency:   m.Latency,
		UserAgent: m.UserAgent,
		UserID:    m.UserID,
		Email:     m.Email,
		UserRole:  m.UserRole,
		CreatedAt: m.CreatedAt,
	}
}

// AccessLogFromDomain maps domain.AccessLog to AccessLogModel.
func AccessLogFromDomain(d *domain.AccessLog) *AccessLogModel {
	if d == nil {
		return nil
	}
	return &AccessLogModel{
		ID:        d.ID,
		RequestID: d.RequestID,
		Method:    d.Method,
		Path:      d.Path,
		IP:        d.IP,
		Status:    d.Status,
		Latency:   d.Latency,
		UserAgent: d.UserAgent,
		UserID:    d.UserID,
		Email:     d.Email,
		UserRole:  d.UserRole,
		CreatedAt: d.CreatedAt,
	}
}

// PlayerVoteModel represents the GORM schema for player_votes table.
type PlayerVoteModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	PlayerID  int64     `gorm:"not null;index"`
	CookieID  string    `gorm:"not null;type:varchar(255);index"`
	IPAddress string    `gorm:"not null;type:varchar(100);index"`
	CreatedAt time.Time `gorm:"not null"`
}

// TableName overrides GORM default table naming conventions.
func (PlayerVoteModel) TableName() string {
	return "player_votes"
}

// CurrencyModel represents exchange rates
type CurrencyModel struct {
	ID        uint      `gorm:"primaryKey;autoIncrement"`
	Code      string    `gorm:"size:3;not null;uniqueIndex:idx_currency_code_to_code"`
	ToCode    string    `gorm:"size:3;not null;uniqueIndex:idx_currency_code_to_code"`
	Rate      float64   `gorm:"type:decimal(15,4);not null"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (CurrencyModel) TableName() string {
	return "currencies"
}

// UserFollowModel represents the GORM schema for user_follows table.
type UserFollowModel struct {
	FollowerID  int64     `gorm:"primaryKey;autoIncrement:false"`
	FollowingID int64     `gorm:"primaryKey;autoIncrement:false"`
	CreatedAt   time.Time `gorm:"not null"`
	Follower    UserModel `gorm:"foreignKey:FollowerID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
	Following   UserModel `gorm:"foreignKey:FollowingID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE;"`
}

// TableName overrides GORM default table naming conventions.
func (UserFollowModel) TableName() string {
	return "user_follows"
}
