package usecase

import (
	"context"
	"fmt"
	"regexp"

	"njara-platform/internal/domain"
)

type postUsecase struct {
	postRepo    domain.PostRepository
	b2cSubRepo  domain.B2CSubscriptionRepository
	userRepo    domain.UserRepository
	notifUsecase domain.NotificationUsecase
}

func NewPostUsecase(
	postRepo domain.PostRepository, 
	b2cSubRepo domain.B2CSubscriptionRepository,
	userRepo domain.UserRepository,
	notifUsecase domain.NotificationUsecase,
) domain.PostUsecase {
	return &postUsecase{
		postRepo:    postRepo,
		b2cSubRepo:  b2cSubRepo,
		userRepo:    userRepo,
		notifUsecase: notifUsecase,
	}
}

func (u *postUsecase) CreatePost(ctx context.Context, userID int64, input domain.CreatePostInput) (*domain.Post, error) {
	if u.b2cSubRepo != nil {
		isPremium, err := u.b2cSubRepo.IsUserPremium(ctx, userID)
		if err != nil {
			return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check premium status", err)
		}
		if !isPremium {
			count, err := u.postRepo.CountByUserIDThisMonth(ctx, userID)
			if err != nil {
				return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to check feed count", err)
			}
			if count >= 3 {
				return nil, domain.NewAppError(domain.ErrCodeForbidden, "free users can only create up to 3 feeds per month. Please upgrade to premium.", nil)
			}
		}
	}

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
	post, err := u.postRepo.GetByID(ctx, postID)
	if err != nil {
		return false, err
	}
	isLiked, err := u.postRepo.ToggleLike(ctx, postID, userID)
	if err == nil && isLiked && post.UserID != userID {
		// send notification
		liker, _ := u.userRepo.GetByID(ctx, userID)
		likerName := "Someone"
		if liker != nil {
			likerName = liker.FullName
		}
		u.notifUsecase.CreateNotification(ctx, &domain.Notification{
			UserID:    post.UserID,
			Title:     "New Like",
			Message:   fmt.Sprintf("%s liked your post.", likerName),
			Type:      domain.NotificationTypeLike,
			RelatedID: postID,
		})
	}
	return isLiked, err
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

	// Trigger mention notifications
	u.triggerMentionNotifications(ctx, userID, postID, input.Content)

	return comment, nil
}

func (u *postUsecase) triggerMentionNotifications(ctx context.Context, senderID int64, postID int64, content string) {
	re := regexp.MustCompile(`@([a-zA-Z0-9_]+)`)
	matches := re.FindAllStringSubmatch(content, -1)
	
	mentionedUsers := make(map[string]bool)
	for _, match := range matches {
		if len(match) > 1 {
			mentionedUsers[match[1]] = true
		}
	}

	for username := range mentionedUsers {
		user, err := u.userRepo.GetByUsername(ctx, username)
		if err == nil && user != nil && user.ID != senderID {
			// Get sender's info for notification message
			sender, _ := u.userRepo.GetByID(ctx, senderID)
			senderName := "Someone"
			if sender != nil {
				senderName = sender.FullName
			}

			_ = u.notifUsecase.CreateNotification(ctx, &domain.Notification{
				UserID:    user.ID,
				Title:     "New Mention",
				Message:   fmt.Sprintf("%s mentioned you in a comment.", senderName),
				Type:      domain.NotificationTypeMention,
				RelatedID: postID,
			})
		}
	}
}

func (u *postUsecase) GetPostInteractors(ctx context.Context, postID int64) ([]*domain.User, error) {
	return u.postRepo.GetPostInteractors(ctx, postID)
}

func (u *postUsecase) GetComments(ctx context.Context, postID int64, limit int, offset int) ([]*domain.PostComment, error) {
	return u.postRepo.GetCommentsByPostID(ctx, postID, limit, offset)
}
