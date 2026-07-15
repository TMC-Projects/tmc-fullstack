package postgres

import (
	"context"

	"njara-platform/internal/domain"

	"gorm.io/gorm"
)

type postRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) domain.PostRepository {
	return &postRepository{db: db}
}

func (r *postRepository) Create(ctx context.Context, post *domain.Post) error {
	model := PostModel{
		UserID:  post.UserID,
		Content: post.Content,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return err
	}
	post.ID = model.ID
	post.CreatedAt = model.CreatedAt
	post.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *postRepository) GetList(ctx context.Context, limit int, offset int) ([]*domain.Post, error) {
	var models []PostModel
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("User.Club").
		Order("created_at desc").
		Limit(limit).
		Offset(offset).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	var posts []*domain.Post
	for _, m := range models {
		posts = append(posts, m.ToDomain())
	}
	return posts, nil
}

func (r *postRepository) GetByID(ctx context.Context, postID int64) (*domain.Post, error) {
	var model PostModel
	err := r.db.WithContext(ctx).Preload("User").Preload("User.Club").First(&model, postID).Error
	if err != nil {
		return nil, err
	}
	return model.ToDomain(), nil
}

func (r *postRepository) Delete(ctx context.Context, postID int64) error {
	// Also delete likes and comments related to this post
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("post_id = ?", postID).Delete(&PostLikeModel{}).Error; err != nil {
			return err
		}
		if err := tx.Where("post_id = ?", postID).Delete(&PostCommentModel{}).Error; err != nil {
			return err
		}
		if err := tx.Delete(&PostModel{}, postID).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *postRepository) ToggleLike(ctx context.Context, postID int64, userID int64) (bool, error) {
	var isLiked bool
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var like PostLikeModel
		err := tx.Where("post_id = ? AND user_id = ?", postID, userID).First(&like).Error
		if err != nil {
			if err == gorm.ErrRecordNotFound {
				// Create like
				if err := tx.Create(&PostLikeModel{PostID: postID, UserID: userID}).Error; err != nil {
					return err
				}
				isLiked = true
				return nil
			}
			return err
		}
		// Unlike
		if err := tx.Delete(&like).Error; err != nil {
			return err
		}
		isLiked = false
		return nil
	})
	return isLiked, err
}

func (r *postRepository) CheckIsLiked(ctx context.Context, postID int64, userID int64) (bool, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&PostLikeModel{}).Where("post_id = ? AND user_id = ?", postID, userID).Count(&count).Error
	return count > 0, err
}

func (r *postRepository) GetLikeCount(ctx context.Context, postID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&PostLikeModel{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}

func (r *postRepository) AddComment(ctx context.Context, comment *domain.PostComment) error {
	model := PostCommentModel{
		PostID:  comment.PostID,
		UserID:  comment.UserID,
		Content: comment.Content,
	}
	if err := r.db.WithContext(ctx).Create(&model).Error; err != nil {
		return err
	}
	comment.ID = model.ID
	comment.CreatedAt = model.CreatedAt
	comment.UpdatedAt = model.UpdatedAt
	return nil
}

func (r *postRepository) GetCommentsByPostID(ctx context.Context, postID int64, limit int, offset int) ([]*domain.PostComment, error) {
	var models []PostCommentModel
	err := r.db.WithContext(ctx).
		Preload("User").
		Preload("User.Club").
		Where("post_id = ?", postID).
		Order("created_at asc").
		Limit(limit).
		Offset(offset).
		Find(&models).Error

	if err != nil {
		return nil, err
	}

	var comments []*domain.PostComment
	for _, m := range models {
		comments = append(comments, m.ToDomain())
	}
	return comments, nil
}

func (r *postRepository) GetCommentCount(ctx context.Context, postID int64) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Model(&PostCommentModel{}).Where("post_id = ?", postID).Count(&count).Error
	return count, err
}
