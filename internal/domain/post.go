package domain

import (
	"context"
	"time"
)

type Post struct {
	ID        int64
	UserID    int64
	User      *User
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time

	LikeCount    int64
	CommentCount int64
	IsLiked      bool // computed for the current user
}

type PostLike struct {
	ID        int64
	PostID    int64
	UserID    int64
	CreatedAt time.Time
}

type PostComment struct {
	ID        int64
	PostID    int64
	UserID    int64
	User      *User
	Content   string
	CreatedAt time.Time
	UpdatedAt time.Time
}

// PostRepository defines the outbound port for Post persistence.
type PostRepository interface {
	Create(ctx context.Context, post *Post) error
	GetList(ctx context.Context, limit int, offset int) ([]*Post, error)
	GetByID(ctx context.Context, postID int64) (*Post, error)
	Delete(ctx context.Context, postID int64) error
	CountByUserIDThisMonth(ctx context.Context, userID int64) (int64, error)
	GetPostInteractors(ctx context.Context, postID int64) ([]*User, error)

	ToggleLike(ctx context.Context, postID int64, userID int64) (bool, error) // Returns true if liked, false if unliked
	CheckIsLiked(ctx context.Context, postID int64, userID int64) (bool, error)
	GetLikeCount(ctx context.Context, postID int64) (int64, error)

	AddComment(ctx context.Context, comment *PostComment) error
	GetCommentsByPostID(ctx context.Context, postID int64, limit int, offset int) ([]*PostComment, error)
	GetCommentCount(ctx context.Context, postID int64) (int64, error)
}

// CreatePostInput defines the payload for creating a post.
type CreatePostInput struct {
	Content string
}

// AddCommentInput defines the payload for adding a comment.
type AddCommentInput struct {
	Content string
}

// PostUsecase defines the inbound port for Post operations.
type PostUsecase interface {
	CreatePost(ctx context.Context, userID int64, input CreatePostInput) (*Post, error)
	GetFeed(ctx context.Context, currentUserID int64, limit int, offset int) ([]*Post, error)
	DeletePost(ctx context.Context, userID int64, postID int64) error
	ToggleLike(ctx context.Context, userID int64, postID int64) (bool, error)
	AddComment(ctx context.Context, userID int64, postID int64, input AddCommentInput) (*PostComment, error)
	GetComments(ctx context.Context, postID int64, limit int, offset int) ([]*PostComment, error)
	GetPostInteractors(ctx context.Context, postID int64) ([]*User, error)
}
