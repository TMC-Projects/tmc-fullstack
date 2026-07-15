package postgres

import (
	"time"

	"njara-platform/internal/domain"
)

type PostModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	UserID    int64     `gorm:"not null"`
	User      UserModel `gorm:"foreignKey:UserID"`
	Content   string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (PostModel) TableName() string {
	return "posts"
}

func (m *PostModel) ToDomain() *domain.Post {
	post := &domain.Post{
		ID:        m.ID,
		UserID:    m.UserID,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.User.ID != 0 {
		post.User = m.User.ToDomain()
	}
	return post
}

type PostLikeModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	PostID    int64     `gorm:"not null;uniqueIndex:idx_post_user_like"`
	UserID    int64     `gorm:"not null;uniqueIndex:idx_post_user_like"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

func (PostLikeModel) TableName() string {
	return "post_likes"
}

type PostCommentModel struct {
	ID        int64     `gorm:"primaryKey;autoIncrement"`
	PostID    int64     `gorm:"not null"`
	UserID    int64     `gorm:"not null"`
	User      UserModel `gorm:"foreignKey:UserID"`
	Content   string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
	UpdatedAt time.Time `gorm:"autoUpdateTime"`
}

func (PostCommentModel) TableName() string {
	return "post_comments"
}

func (m *PostCommentModel) ToDomain() *domain.PostComment {
	comment := &domain.PostComment{
		ID:        m.ID,
		PostID:    m.PostID,
		UserID:    m.UserID,
		Content:   m.Content,
		CreatedAt: m.CreatedAt,
		UpdatedAt: m.UpdatedAt,
	}
	if m.User.ID != 0 {
		comment.User = m.User.ToDomain()
	}
	return comment
}
