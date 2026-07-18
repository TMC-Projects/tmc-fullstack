package postgres

import (
	"context"
	"time"

	"njara-platform/internal/domain"
	"gorm.io/gorm"
)

type NotificationModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"index;not null"`
	Title     string    `gorm:"not null"`
	Message   string    `gorm:"not null"`
	Type      string    `gorm:"not null"`
	RelatedID int64     
	IsRead    bool      `gorm:"default:false"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (NotificationModel) TableName() string {
	return "notifications"
}

func (m *NotificationModel) ToDomain() *domain.Notification {
	return &domain.Notification{
		ID:        m.ID,
		UserID:    m.UserID,
		Title:     m.Title,
		Message:   m.Message,
		Type:      domain.NotificationType(m.Type),
		RelatedID: m.RelatedID,
		IsRead:    m.IsRead,
		CreatedAt: m.CreatedAt,
	}
}

type notificationRepository struct {
	db *gorm.DB
}

func NewNotificationRepository(db *gorm.DB) domain.NotificationRepository {
	return &notificationRepository{db: db}
}

func (r *notificationRepository) Create(ctx context.Context, n *domain.Notification) error {
	model := NotificationModel{
		UserID:    n.UserID,
		Title:     n.Title,
		Message:   n.Message,
		Type:      string(n.Type),
		RelatedID: n.RelatedID,
		IsRead:    n.IsRead,
	}
	err := r.db.WithContext(ctx).Create(&model).Error
	if err == nil {
		n.ID = model.ID
		n.CreatedAt = model.CreatedAt
	}
	return err
}

func (r *notificationRepository) CreateBulk(ctx context.Context, notifications []*domain.Notification) error {
	if len(notifications) == 0 {
		return nil
	}
	var models []NotificationModel
	for _, n := range notifications {
		models = append(models, NotificationModel{
			UserID:    n.UserID,
			Title:     n.Title,
			Message:   n.Message,
			Type:      string(n.Type),
			RelatedID: n.RelatedID,
			IsRead:    n.IsRead,
		})
	}
	return r.db.WithContext(ctx).Create(&models).Error
}

func (r *notificationRepository) GetListByUserID(ctx context.Context, userID int64, limit, offset int) ([]*domain.Notification, error) {
	var models []NotificationModel
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&models).Error
	if err != nil {
		return nil, err
	}

	var results []*domain.Notification
	for _, m := range models {
		results = append(results, m.ToDomain())
	}
	return results, nil
}

func (r *notificationRepository) MarkAsRead(ctx context.Context, notificationID int64, userID int64) error {
	return r.db.WithContext(ctx).
		Model(&NotificationModel{}).
		Where("id = ? AND user_id = ?", notificationID, userID).
		Update("is_read", true).Error
}

func (r *notificationRepository) MarkAllAsRead(ctx context.Context, userID int64) error {
	return r.db.WithContext(ctx).
		Model(&NotificationModel{}).
		Where("user_id = ?", userID).
		Update("is_read", true).Error
}

func (r *notificationRepository) CountUnread(ctx context.Context, userID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).
		Model(&NotificationModel{}).
		Where("user_id = ? AND is_read = false", userID).
		Count(&count).Error
	return count, err
}

func (r *notificationRepository) CountNewTrialNotificationsThisMonth(ctx context.Context, userID int64) (int64, error) {
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())

	var count int64
	err := r.db.WithContext(ctx).
		Model(&NotificationModel{}).
		Where("user_id = ? AND type = ? AND created_at >= ?", userID, string(domain.NotificationTypeNewTrial), startOfMonth).
		Count(&count).Error

	return count, err
}
