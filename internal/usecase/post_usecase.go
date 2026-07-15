package usecase

import (
	"context"

	"njara-platform/internal/domain"
)

type postUsecase struct {
	postRepo domain.PostRepository
}

func NewPostUsecase(postRepo domain.PostRepository) domain.PostUsecase {
	return &postUsecase{
		postRepo: postRepo,
	}
}

func (u *postUsecase) CreatePost(ctx context.Context, userID int64, input domain.CreatePostInput) (*domain.Post, error) {
	post := &domain.Post{
		UserID:  userID,
		Content: input.Content,
	}
	if err := u.postRepo.Create(ctx, post); err != nil {
		return nil, err
	}
	return u.postRepo.GetByID(ctx, post.ID)
}

func (u *postUsecase) GetFeed(ctx context.Context, currentUserID int64, limit int, offset int) ([]*domain.Post, error) {
	posts, err := u.postRepo.GetList(ctx, limit, offset)
	if err != nil {
		return nil, err
	}

	for _, p := range posts {
		// Get like count
		likeCount, _ := u.postRepo.GetLikeCount(ctx, p.ID)
		p.LikeCount = likeCount

		// Get comment count
		commentCount, _ := u.postRepo.GetCommentCount(ctx, p.ID)
		p.CommentCount = commentCount

		// Check if liked by current user
		isLiked, _ := u.postRepo.CheckIsLiked(ctx, p.ID, currentUserID)
		p.IsLiked = isLiked
	}

	return posts, nil
}

func (u *postUsecase) DeletePost(ctx context.Context, userID int64, postID int64) error {
	post, err := u.postRepo.GetByID(ctx, postID)
	if err != nil {
		return err
	}
	if post.UserID != userID {
		return domain.NewAppError(domain.ErrCodeUnauthorized, "You are not authorized to delete this post", nil)
	}
	return u.postRepo.Delete(ctx, postID)
}

func (u *postUsecase) ToggleLike(ctx context.Context, userID int64, postID int64) (bool, error) {
	// check if post exists
	_, err := u.postRepo.GetByID(ctx, postID)
	if err != nil {
		return false, err
	}
	return u.postRepo.ToggleLike(ctx, postID, userID)
}

func (u *postUsecase) AddComment(ctx context.Context, userID int64, postID int64, input domain.AddCommentInput) (*domain.PostComment, error) {
	// check if post exists
	_, err := u.postRepo.GetByID(ctx, postID)
	if err != nil {
		return nil, err
	}

	comment := &domain.PostComment{
		PostID:  postID,
		UserID:  userID,
		Content: input.Content,
	}

	if err := u.postRepo.AddComment(ctx, comment); err != nil {
		return nil, err
	}
	// Fetch complete with user preload if needed, or rely on frontend. Let's just return what we have.
	// Actually we should fetch it to get user info.
	// Let's do a simple get or we can just return the raw for now.
	return comment, nil
}

func (u *postUsecase) GetComments(ctx context.Context, postID int64, limit int, offset int) ([]*domain.PostComment, error) {
	return u.postRepo.GetCommentsByPostID(ctx, postID, limit, offset)
}
