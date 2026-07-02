package domain

import (
	"context"
	"time"
)

// UserFollow represents a follow relationship between two users.
type UserFollow struct {
	FollowerID  int64
	FollowingID int64
	CreatedAt   time.Time
}

// UserFollowRepository defines the interface for data access related to user follows.
type UserFollowRepository interface {
	Follow(ctx context.Context, followerID, followingID int64) error
	Unfollow(ctx context.Context, followerID, followingID int64) error
	IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error)
	GetFollowersCount(ctx context.Context, userID int64) (int64, error)
	GetFollowingCount(ctx context.Context, userID int64) (int64, error)
	GetFollowers(ctx context.Context, userID int64, limit, offset int) ([]*User, error)
	GetFollowing(ctx context.Context, userID int64, limit, offset int) ([]*User, error)
}

// UserFollowUsecase defines the business logic interface for user follows.
type UserFollowUsecase interface {
	Follow(ctx context.Context, followerID, followingID int64) error
	Unfollow(ctx context.Context, followerID, followingID int64) error
	IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error)
	GetFollowersCount(ctx context.Context, userID int64) (int64, error)
	GetFollowingCount(ctx context.Context, userID int64) (int64, error)
	GetFollowers(ctx context.Context, userID int64, limit, offset int) ([]*User, error)
	GetFollowing(ctx context.Context, userID int64, limit, offset int) ([]*User, error)
}
