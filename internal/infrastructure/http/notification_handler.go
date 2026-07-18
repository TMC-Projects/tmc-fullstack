package http

import (
	"bufio"
	"encoding/json"
	"fmt"
	"strconv"
	"time"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
)

type NotificationHandler struct {
	notifUsecase domain.NotificationUsecase
}

func NewNotificationHandler(notifUsecase domain.NotificationUsecase) *NotificationHandler {
	return &NotificationHandler{
		notifUsecase: notifUsecase,
	}
}

func (h *NotificationHandler) GetMyNotifications(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	limit, _ := strconv.Atoi(c.Query("limit", "20"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	notifications, err := h.notifUsecase.GetMyNotifications(c.Context(), userID, limit, offset)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to get notifications", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Notifications fetched successfully", notifications)
}

func (h *NotificationHandler) GetUnreadCount(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	count, err := h.notifUsecase.GetUnreadCount(c.Context(), userID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to get unread count", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Unread count fetched successfully", fiber.Map{
		"unread_count": count,
	})
}

func (h *NotificationHandler) MarkAsRead(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	idStr := c.Params("id")
	if idStr == "read-all" {
		err := h.notifUsecase.MarkAllAsRead(c.Context(), userID)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "Failed to mark all as read", err)
		}
		return SendSuccess(c, fiber.StatusOK, "All notifications marked as read", nil)
	}

	notificationID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid notification ID", err)
	}

	err = h.notifUsecase.MarkAsRead(c.Context(), notificationID, userID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to mark as read", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Notification marked as read", nil)
}

func (h *NotificationHandler) Stream(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	c.Set("Content-Type", "text/event-stream")
	c.Set("Cache-Control", "no-cache")
	c.Set("Connection", "keep-alive")
	c.Set("Transfer-Encoding", "chunked")

	// Create a channel for this connection
	ch := h.notifUsecase.Subscribe(userID)

	c.Context().SetBodyStreamWriter(func(w *bufio.Writer) {
		defer h.notifUsecase.Unsubscribe(userID, ch)

		fmt.Fprintf(w, "event: connected\ndata: \"ok\"\n\n")
		w.Flush()

		ticker := time.NewTicker(15 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case event := <-ch:
				data, err := json.Marshal(event)
				if err == nil {
					fmt.Fprintf(w, "data: %s\n\n", string(data))
					if err := w.Flush(); err != nil {
						return // connection closed
					}
				}
			case <-ticker.C:
				fmt.Fprintf(w, ": keepalive\n\n")
				if err := w.Flush(); err != nil {
					return // connection closed
				}
			}
		}
	})

	return nil
}
