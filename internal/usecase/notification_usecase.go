package usecase

import (
	"context"
	"fmt"
	"strconv"
	"sync"
	"time"

	"njara-platform/internal/domain"
)

const (
	unreadCountKeyPrefix = "notif_unread:"
)

type notificationUsecase struct {
	notifRepo  domain.NotificationRepository
	userRepo   domain.UserRepository
	b2cSubRepo domain.B2CSubscriptionRepository
	cache      domain.CacheRepository
	clients    map[int64][]chan domain.NotificationEvent
	mu         sync.RWMutex
}

func NewNotificationUsecase(
	notifRepo domain.NotificationRepository,
	userRepo domain.UserRepository,
	b2cSubRepo domain.B2CSubscriptionRepository,
	cache domain.CacheRepository,
) domain.NotificationUsecase {
	return &notificationUsecase{
		notifRepo:  notifRepo,
		userRepo:   userRepo,
		b2cSubRepo: b2cSubRepo,
		cache:      cache,
		clients:    make(map[int64][]chan domain.NotificationEvent),
	}
}

func (u *notificationUsecase) Subscribe(userID int64) <-chan domain.NotificationEvent {
	ch := make(chan domain.NotificationEvent, 10)
	u.mu.Lock()
	u.clients[userID] = append(u.clients[userID], ch)
	u.mu.Unlock()
	return ch
}

func (u *notificationUsecase) Unsubscribe(userID int64, ch <-chan domain.NotificationEvent) {
	u.mu.Lock()
	defer u.mu.Unlock()

	channels := u.clients[userID]
	for i, c := range channels {
		if c == ch {
			u.clients[userID] = append(channels[:i], channels[i+1:]...)
			close(c)
			break
		}
	}
	if len(u.clients[userID]) == 0 {
		delete(u.clients, userID)
	}
}

func (u *notificationUsecase) notifyClients(userID int64, event domain.NotificationEvent) {
	u.mu.RLock()
	defer u.mu.RUnlock()

	if channels, ok := u.clients[userID]; ok {
		for _, ch := range channels {
			select {
			case ch <- event:
			default:
				// Channel full, drop event to avoid blocking
			}
		}
	}
}

func (u *notificationUsecase) incrementUnreadCount(ctx context.Context, userID int64) {
	key := fmt.Sprintf("%s%d", unreadCountKeyPrefix, userID)
	val, err := u.cache.Get(ctx, key)
	var newCount int64 = 1
	if err == nil && val != nil {
		if count, err := strconv.ParseInt(string(val), 10, 64); err == nil {
			newCount = count + 1
		}
	} else {
		dbCount, _ := u.notifRepo.CountUnread(ctx, userID)
		newCount = dbCount
	}
	_ = u.cache.Set(ctx, key, []byte(fmt.Sprintf("%d", newCount)), 24*time.Hour)
	u.notifyClients(userID, domain.NotificationEvent{Type: "unread_count", Payload: newCount})
}

func (u *notificationUsecase) clearUnreadCount(ctx context.Context, userID int64) {
	key := fmt.Sprintf("%s%d", unreadCountKeyPrefix, userID)
	_ = u.cache.Delete(ctx, key)
	u.notifyClients(userID, domain.NotificationEvent{Type: "unread_count", Payload: 0})
}

func (u *notificationUsecase) CreateNotification(ctx context.Context, notification *domain.Notification) error {
	err := u.notifRepo.Create(ctx, notification)
	if err == nil {
		u.notifyClients(notification.UserID, domain.NotificationEvent{Type: "new_notification", Payload: notification})
		u.incrementUnreadCount(ctx, notification.UserID)
	}
	return err
}

func (u *notificationUsecase) BroadcastNewTrial(ctx context.Context, trialID int64, clubName string) error {
	// Fetch all players
	// For MVP, we can get list of all users and filter by category "player".
	users, err := u.userRepo.GetUsersByCategory(ctx, "player")
	if err != nil {
		return err
	}

	var toNotify []*domain.Notification

	for _, user := range users {
		if user.Category != "player" {
			continue
		}

		// Check subscription
		isPremium, _ := u.b2cSubRepo.IsUserPremium(ctx, user.ID)
		if !isPremium {
			count, _ := u.notifRepo.CountNewTrialNotificationsThisMonth(ctx, user.ID)
			if count >= 3 {
				continue // skip, limit reached
			}
		}

		toNotify = append(toNotify, &domain.Notification{
			UserID:    user.ID,
			Title:     "New Open Trial",
			Message:   fmt.Sprintf("%s has opened a new trial!", clubName),
			Type:      domain.NotificationTypeNewTrial,
			RelatedID: trialID,
		})
	}

	if len(toNotify) > 0 {
		err := u.notifRepo.CreateBulk(ctx, toNotify)
		if err == nil {
			for _, n := range toNotify {
				u.notifyClients(n.UserID, domain.NotificationEvent{Type: "new_notification", Payload: n})
				u.incrementUnreadCount(ctx, n.UserID)
			}
		}
		return err
	}

	return nil
}

func (u *notificationUsecase) GetMyNotifications(ctx context.Context, userID int64, limit, offset int) ([]*domain.Notification, error) {
	return u.notifRepo.GetListByUserID(ctx, userID, limit, offset)
}

func (u *notificationUsecase) GetUnreadCount(ctx context.Context, userID int64) (int64, error) {
	key := fmt.Sprintf("%s%d", unreadCountKeyPrefix, userID)
	val, err := u.cache.Get(ctx, key)
	if err == nil && val != nil {
		if count, err := strconv.ParseInt(string(val), 10, 64); err == nil {
			return count, nil
		}
	}

	count, err := u.notifRepo.CountUnread(ctx, userID)
	if err != nil {
		return 0, err
	}

	_ = u.cache.Set(ctx, key, []byte(fmt.Sprintf("%d", count)), 24*time.Hour)
	return count, nil
}

func (u *notificationUsecase) MarkAsRead(ctx context.Context, notificationID int64, userID int64) error {
	err := u.notifRepo.MarkAsRead(ctx, notificationID, userID)
	if err == nil {
		u.clearUnreadCount(ctx, userID)
	}
	return err
}

func (u *notificationUsecase) MarkAllAsRead(ctx context.Context, userID int64) error {
	err := u.notifRepo.MarkAllAsRead(ctx, userID)
	if err == nil {
		u.clearUnreadCount(ctx, userID)
	}
	return err
}
