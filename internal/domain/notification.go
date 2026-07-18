package domain

import (
	"context"
	"time"
)

type NotificationType string

const (
	NotificationTypeMention     NotificationType = "mention"
	NotificationTypeTrialStatus NotificationType = "trial_status"
	NotificationTypeNewTrial    NotificationType = "new_trial"
	NotificationTypeLike        NotificationType = "like"
	NotificationTypeFollow      NotificationType = "follow"
)

type Notification struct {
	ID        int64            `json:"id"`
	UserID    int64            `json:"user_id"`
	Title     string           `json:"title"`
	Message   string           `json:"message"`
	Type      NotificationType `json:"type"`
	RelatedID int64            `json:"related_id"`
	IsRead    bool             `json:"is_read"`
	CreatedAt time.Time        `json:"created_at"`
}

type NotificationEvent struct {
	Type    string      `json:"type"` // e.g., "unread_count", "new_notification"
	Payload interface{} `json:"payload"`
}

type NotificationRepository interface {
	Create(ctx context.Context, notification *Notification) error
	CreateBulk(ctx context.Context, notifications []*Notification) error
	GetListByUserID(ctx context.Context, userID int64, limit, offset int) ([]*Notification, error)
	MarkAsRead(ctx context.Context, notificationID int64, userID int64) error
	MarkAllAsRead(ctx context.Context, userID int64) error
	CountUnread(ctx context.Context, userID int64) (int64, error)
	CountNewTrialNotificationsThisMonth(ctx context.Context, userID int64) (int64, error)
}

type NotificationUsecase interface {
	CreateNotification(ctx context.Context, notification *Notification) error
	BroadcastNewTrial(ctx context.Context, trialID int64, clubName string) error
	GetMyNotifications(ctx context.Context, userID int64, limit, offset int) ([]*Notification, error)
	GetUnreadCount(ctx context.Context, userID int64) (int64, error)
	MarkAsRead(ctx context.Context, notificationID int64, userID int64) error
	MarkAllAsRead(ctx context.Context, userID int64) error
	Subscribe(userID int64) <-chan NotificationEvent
	Unsubscribe(userID int64, ch <-chan NotificationEvent)
}
