package postgres

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type userRepository struct {
	db *gorm.DB
}

// NewUserRepository creates a new instance of domain.UserRepository adapter using GORM.
func NewUserRepository(db *gorm.DB) domain.UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) Create(ctx context.Context, user *domain.User) error {
	m := UserFromDomain(user)
	err := r.db.WithContext(ctx).Create(m).Error
	if err != nil {
		return err
	}
	user.ID = m.ID
	user.CreatedAt = m.CreatedAt
	user.UpdatedAt = m.UpdatedAt
	return nil
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*domain.User, error) {
	var m UserModel
	err := r.db.WithContext(ctx).
		Preload("Club").
		Preload("Stats.Game").
		Preload("Achievements").
		Preload("Highlights").
		Preload("SocialMedias").
		First(&m, id).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	var m UserModel
	err := r.db.WithContext(ctx).Where("email = ?", email).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *userRepository) GetByUsername(ctx context.Context, username string) (*domain.User, error) {
	var m UserModel
	err := r.db.WithContext(ctx).Where("username = ?", username).First(&m).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, err
	}
	return m.ToDomain(), nil
}

func (r *userRepository) GetByCategoryAndClub(ctx context.Context, category string, clubID int64) ([]*domain.User, error) {
	var models []UserModel
	err := r.db.WithContext(ctx).Where("category = ? AND club_id = ?", category, clubID).Find(&models).Error
	if err != nil {
		return nil, err
	}

	var users []*domain.User
	for _, m := range models {
		users = append(users, m.ToDomain())
	}
	return users, nil
}

func (r *userRepository) UpdateClubID(ctx context.Context, userID int64, clubID int64) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("club_id", clubID).Error
}

func (r *userRepository) UpdateTeamID(ctx context.Context, userID int64, teamID *int64) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("team_id", teamID).Error
}

// UpdateMarketValue sets the market_value for a specific user (player or coach).
func (r *userRepository) UpdateMarketValue(ctx context.Context, userID int64, value *int64) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("market_value", value).Error
}

// UpdateContractAndSalary updates the contract_until and salary for a specific user.
func (r *userRepository) UpdateContractAndSalary(ctx context.Context, userID int64, contractUntil *time.Time, salary *int64) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Updates(map[string]interface{}{
		"contract_until": contractUntil,
		"salary":         salary,
	}).Error
}

// GetTalents returns a paginated, filtered, searchable list of talents enriched with their
// transfer market status via a LEFT JOIN on the transfer_market table.
func (r *userRepository) GetTalents(ctx context.Context, filter domain.TalentFilter) ([]*domain.TalentResult, int64, error) {
	// Talent categories only (exclude owner)
	talentCategories := []string{"player", "coach", "staff", "ba", "manager", "asst_coach"}

	type scanResult struct {
		ID             int64  `gorm:"column:id"`
		Username       string `gorm:"column:username"`
		FullName       string `gorm:"column:full_name"`
		Email          string `gorm:"column:email"`
		Category       string `gorm:"column:category"`
		ClubID         int64  `gorm:"column:club_id"`
		TeamID         *int64 `gorm:"column:team_id"`
		Bio            string     `gorm:"column:bio"`
		Status         string     `gorm:"column:status"`
		ContractUntil  *time.Time `gorm:"column:contract_until"`
		Salary         *int64     `gorm:"column:salary"`
		MarketValue    *int64     `gorm:"column:market_value"`
		TransferStatus string `gorm:"column:transfer_status"`
		ProfilePictureUrl string `gorm:"column:profile_picture_url"`
	}

	buildBase := func(db *gorm.DB) *gorm.DB {
		q := db.Table("users u").
			Joins("LEFT JOIN transfer_market tm ON tm.user_id = u.id").
			Where("u.category IN ?", talentCategories)

		if filter.CallerClubID > 0 {
			q = q.Where("u.club_id = ?", filter.CallerClubID)
		}

		if filter.TeamID != nil {
			q = q.Where("u.team_id = ?", *filter.TeamID)
		}

		if s := strings.TrimSpace(filter.Search); s != "" {
			pattern := "%" + strings.ToLower(s) + "%"
			q = q.Where("(LOWER(u.full_name) LIKE ? OR LOWER(u.username) LIKE ?)", pattern, pattern)
		}
		if filter.Category != "" {
			q = q.Where("u.category = ?", filter.Category)
		}
		if filter.TransferStatus != "" {
			if filter.TransferStatus == "not_listed" {
				q = q.Where("tm.id IS NULL")
			} else {
				q = q.Where("tm.status = ?", filter.TransferStatus)
			}
		}
		return q
	}

	// Count total
	var total int64
	if err := buildBase(r.db.WithContext(ctx)).Count(&total).Error; err != nil {
		return nil, 0, err
	}

	// Pagination defaults
	page := filter.Page
	if page < 1 {
		page = 1
	}
	limit := filter.Limit
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset := (page - 1) * limit

	var rows []scanResult
	err := buildBase(r.db.WithContext(ctx)).
		Select(`u.id, u.username, u.full_name, u.email, u.category, u.club_id, u.team_id,
			u.bio, u.status, u.contract_until, u.salary, u.market_value, u.profile_picture_url,
			COALESCE(tm.status, 'not_listed') AS transfer_status`).
		Order("u.created_at DESC").
		Offset(offset).
		Limit(limit).
		Scan(&rows).Error
	if err != nil {
		return nil, 0, err
	}

	results := make([]*domain.TalentResult, len(rows))
	for i, row := range rows {
		results[i] = &domain.TalentResult{
			ID:             row.ID,
			Username:       row.Username,
			FullName:       row.FullName,
			Email:          row.Email,
			Category:       row.Category,
			ClubID:         row.ClubID,
			TeamID:         row.TeamID,
			Bio:            row.Bio,
			Status:         row.Status,
			ContractUntil:  row.ContractUntil,
			Salary:         row.Salary,
			MarketValue:    row.MarketValue,
			TransferStatus: row.TransferStatus,
			ProfilePictureUrl: row.ProfilePictureUrl,
		}
	}

	return results, total, nil
}

// UpdateProfile updates the main profile fields of a user.
func (r *userRepository) UpdateProfile(ctx context.Context, user *domain.User) error {
	m := UserFromDomain(user)
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", user.ID).Updates(map[string]interface{}{
		"full_name": m.FullName,
		"bio":       m.Bio,
		"language":  m.Language,
	}).Error
}

// UpdateProfilePicture updates the user's profile picture URL
func (r *userRepository) UpdateProfilePicture(ctx context.Context, userID int64, url string) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("profile_picture_url", url).Error
}

func (r *userRepository) UpdateStatus(ctx context.Context, userID int64, status string) error {
	return r.db.WithContext(ctx).Model(&UserModel{}).Where("id = ?", userID).Update("status", status).Error
}
