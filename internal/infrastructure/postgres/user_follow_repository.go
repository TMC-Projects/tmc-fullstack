package postgres

import (
	"context"
	"errors"

	"njara-platform/internal/domain"
	"gorm.io/gorm"
)

type userFollowRepository struct {
	db *gorm.DB
}

func NewUserFollowRepository(db *gorm.DB) domain.UserFollowRepository {
	return &userFollowRepository{db: db}
}

func (r *userFollowRepository) Follow(ctx context.Context, followerID, followingID int64) error {
	follow := &UserFollowModel{
		FollowerID:  followerID,
		FollowingID: followingID,
	}
	
	err := r.db.WithContext(ctx).Create(follow).Error
	if err != nil {
		// Ignore duplicate key error if they already follow
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil
		}
		return err
	}
	return nil
}

func (r *userFollowRepository) Unfollow(ctx context.Context, followerID, followingID int64) error {
	return r.db.WithContext(ctx).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Delete(&UserFollowModel{}).Error
}

func (r *userFollowRepository) IsFollowing(ctx context.Context, followerID, followingID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&UserFollowModel{}).
		Where("follower_id = ? AND following_id = ?", followerID, followingID).
		Count(&count).Error
	
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

func (r *userFollowRepository) GetFollowersCount(ctx context.Context, userID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&UserFollowModel{}).
		Where("following_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *userFollowRepository) GetFollowingCount(ctx context.Context, userID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&UserFollowModel{}).
		Where("follower_id = ?", userID).
		Count(&count).Error
	return count, err
}

func (r *userFollowRepository) GetFollowers(ctx context.Context, userID int64, limit, offset int) ([]*domain.User, error) {
	var follows []UserFollowModel
	err := r.db.WithContext(ctx).
		Preload("Follower").
		Preload("Follower.Club").
		Where("following_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&follows).Error
	
	if err != nil {
		return nil, err
	}
	
	var users []*domain.User
	for _, f := range follows {
		u := &domain.User{
			ID: f.Follower.ID,
			Username: f.Follower.Username,
			FullName: f.Follower.FullName,
			Email: f.Follower.Email,
			Category: f.Follower.Category,
			ClubID: f.Follower.ClubID,
		}
		if f.Follower.Club.ID != 0 {
			u.Club = f.Follower.Club.ToDomain()
		}
		users = append(users, u)
	}
	return users, nil
}

func (r *userFollowRepository) GetFollowing(ctx context.Context, userID int64, limit, offset int) ([]*domain.User, error) {
	var follows []UserFollowModel
	err := r.db.WithContext(ctx).
		Preload("Following").
		Preload("Following.Club").
		Where("follower_id = ?", userID).
		Limit(limit).
		Offset(offset).
		Order("created_at DESC").
		Find(&follows).Error
	
	if err != nil {
		return nil, err
	}
	
	var users []*domain.User
	for _, f := range follows {
		u := &domain.User{
			ID: f.Following.ID,
			Username: f.Following.Username,
			FullName: f.Following.FullName,
			Email: f.Following.Email,
			Category: f.Following.Category,
			ClubID: f.Following.ClubID,
		}
		if f.Following.Club.ID != 0 {
			u.Club = f.Following.Club.ToDomain()
		}
		users = append(users, u)
	}
	return users, nil
}
