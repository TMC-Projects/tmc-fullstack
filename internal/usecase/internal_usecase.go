package usecase

import (
	"context"
	"fmt"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
	"golang.org/x/crypto/bcrypt"
	"crypto/rand"
	"encoding/base64"
)

type InternalUsecase interface {
	GetTables(ctx context.Context) ([]string, error)
	GetTableData(ctx context.Context, tableName string) ([]map[string]interface{}, error)
	GetTableDataByID(ctx context.Context, tableName string, id string) (map[string]interface{}, error)
	CreateTableData(ctx context.Context, tableName string, data map[string]interface{}) error
	UpdateTableData(ctx context.Context, tableName string, id string, data map[string]interface{}) error
	DeleteTableData(ctx context.Context, tableName string, id string) error
	ResetUserPassword(ctx context.Context, userID string) (string, error)
}

type internalUsecase struct {
	db *gorm.DB
}

func NewInternalUsecase(db *gorm.DB) InternalUsecase {
	return &internalUsecase{
		db: db,
	}
}

var allowedTables = map[string]bool{
	"games":                    true,
	"subscription_plans":       true,
	"b2c_subscription_plans":   true,
	"clubs":                    true,
	"club_onboardings":         true,
	"users":                    true,
	"subscriptions":            true,
	"b2c_player_subscriptions": true,
}

func isTableAllowed(tableName string) bool {
	return allowedTables[tableName]
}

func (u *internalUsecase) GetTables(ctx context.Context) ([]string, error) {
	return []string{
		"games",
		"subscription_plans",
		"b2c_subscription_plans",
		"clubs",
		"club_onboardings",
		"users",
	}, nil
}

func (u *internalUsecase) GetTableData(ctx context.Context, tableName string) ([]map[string]interface{}, error) {
	if !isTableAllowed(tableName) {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "table not allowed", nil)
	}
	var results []map[string]interface{}
	if err := u.db.WithContext(ctx).Table(tableName).Order("id asc").Find(&results).Error; err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, fmt.Sprintf("failed to get data from table %s", tableName), err)
	}
	return results, nil
}

func (u *internalUsecase) GetTableDataByID(ctx context.Context, tableName string, id string) (map[string]interface{}, error) {
	if !isTableAllowed(tableName) {
		return nil, domain.NewAppError(domain.ErrCodeForbidden, "table not allowed", nil)
	}
	var result map[string]interface{}
	if err := u.db.WithContext(ctx).Table(tableName).Where("id = ?", id).First(&result).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, domain.NewAppError(domain.ErrCodeNotFound, "record not found", err)
		}
		return nil, domain.NewAppError(domain.ErrCodeInternal, fmt.Sprintf("failed to get data from table %s", tableName), err)
	}
	return result, nil
}

func (u *internalUsecase) CreateTableData(ctx context.Context, tableName string, data map[string]interface{}) error {
	if !isTableAllowed(tableName) {
		return domain.NewAppError(domain.ErrCodeForbidden, "table not allowed", nil)
	}
	if err := u.db.WithContext(ctx).Table(tableName).Create(data).Error; err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, fmt.Sprintf("failed to create data in table %s", tableName), err)
	}
	return nil
}

func (u *internalUsecase) UpdateTableData(ctx context.Context, tableName string, id string, data map[string]interface{}) error {
	if !isTableAllowed(tableName) {
		return domain.NewAppError(domain.ErrCodeForbidden, "table not allowed", nil)
	}
	if err := u.db.WithContext(ctx).Table(tableName).Where("id = ?", id).Updates(data).Error; err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, fmt.Sprintf("failed to update data in table %s", tableName), err)
	}
	return nil
}

func (u *internalUsecase) DeleteTableData(ctx context.Context, tableName string, id string) error {
	if !isTableAllowed(tableName) {
		return domain.NewAppError(domain.ErrCodeForbidden, "table not allowed", nil)
	}
	if err := u.db.WithContext(ctx).Exec(fmt.Sprintf("DELETE FROM %s WHERE id = ?", tableName), id).Error; err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, fmt.Sprintf("failed to delete data in table %s", tableName), err)
	}
	return nil
}

func (u *internalUsecase) ResetUserPassword(ctx context.Context, userID string) (string, error) {
	b := make([]byte, 12)
	_, err := rand.Read(b)
	if err != nil {
		return "", err
	}
	newPassword := base64.URLEncoding.EncodeToString(b)[:12]

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}

	result := u.db.Table("users").Where("id = ?", userID).Update("password_hash", string(hash))
	if result.Error != nil {
		return "", result.Error
	}
	if result.RowsAffected == 0 {
		return "", fmt.Errorf("user not found")
	}

	return newPassword, nil
}
