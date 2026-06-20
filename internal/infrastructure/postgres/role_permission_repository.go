package postgres

import (
	"context"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type rolePermissionRepository struct {
	db *gorm.DB
}

// NewRolePermissionRepository creates a new instance of domain.RolePermissionRepository.
func NewRolePermissionRepository(db *gorm.DB) domain.RolePermissionRepository {
	return &rolePermissionRepository{db: db}
}

func (r *rolePermissionRepository) GetPermissionsByCategory(ctx context.Context, category string) ([]string, error) {
	var permissions []string
	err := r.db.WithContext(ctx).
		Model(&RolePermissionModel{}).
		Where("category = ?", category).
		Pluck("permission", &permissions).
		Error
	if err != nil {
		return nil, err
	}
	return permissions, nil
}
