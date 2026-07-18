package usecase

import (
	"context"
	"errors"
	"fmt"

	"njara-platform/internal/domain"
)

type userFollowUsecase struct {
	followRepo   domain.UserFollowRepository
	userRepo     domain.UserRepository
	notifUsecase domain.NotificationUsecase
}

func NewUserFollowUsecase(followRepo domain.UserFollowRepository, userRepo domain.UserRepository, notifUsecase domain.NotificationUsecase) domain.UserFollowUsecase {
	return &userFollowUsecase{
		followRepo:   followRepo,
		userRepo:     userRepo,
		notifUsecase: notifUsecase,
	}
}

func (u *userFollowUsecase) Follow(ctx context.Context, followerID, followingID int64) error {
	if followerID == followingID {
		return errors.New("users cannot follow themselves")
	}

	// Verify the target user exists
	_, err := u.userRepo.GetByID(ctx, followingID)
	if err != nil {
		return err
	}

	err = u.followRepo.Follow(ctx, followerID, followingID)
	if err == nil {
		follower, _ := u.userRepo.GetByID(ctx, followerID)
		followerName := "Someone"
		if follower != nil {
			followerName = follower.FullName
		}
		u.notifUsecase.CreateNotification(ctx, &domain.Notification{
			UserID:    followingID,
			Title:     "New Follower",
			Message:   fmt.Sprintf("%s started following you.", followerName),
			Type:      domain.NotificationTypeFollow,
			RelatedID: followerID,
		})
	}
	return err
}

func (u *userFollowUsecase) Unfollow(ctx context.Context, followerID, followingID int64) error {
	if followerID == followingID {
		return errors.New("users cannot unfollow themselves")
	}
	return u.followRepo.Unfollow(ctx, followerID, followingID)
}

func (u *userFollowUsecase) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	if followerID == followingID {
		return false, nil
	}
	return u.followRepo.IsFollowing(ctx, followerID, followingID)
}

func (u *userFollowUsecase) GetFollowersCount(ctx context.Context, userID int64) (int64, error) {
	return u.followRepo.GetFollowersCount(ctx, userID)
}

func (u *userFollowUsecase) GetFollowingCount(ctx context.Context, userID int64) (int64, error) {
	return u.followRepo.GetFollowingCount(ctx, userID)
}

func (u *userFollowUsecase) GetFollowers(ctx context.Context, userID int64, limit, offset int) ([]*domain.User, error) {
	return u.followRepo.GetFollowers(ctx, userID, limit, offset)
}

func (u *userFollowUsecase) GetFollowing(ctx context.Context, userID int64, limit, offset int) ([]*domain.User, error) {
	return u.followRepo.GetFollowing(ctx, userID, limit, offset)
}
