package usecase

import (
	"context"
	"errors"
	"njara-platform/internal/domain"
)

type feedbackUsecase struct {
	feedbackRepo domain.FeedbackRepository
}

func NewFeedbackUsecase(repo domain.FeedbackRepository) domain.FeedbackUsecase {
	return &feedbackUsecase{feedbackRepo: repo}
}

func (u *feedbackUsecase) SubmitFeedback(ctx context.Context, userID uint, message string) (*domain.Feedback, error) {
	if message == "" {
		return nil, errors.New("message cannot be empty")
	}

	feedback := &domain.Feedback{
		UserID:  userID,
		Message: message,
	}

	if err := u.feedbackRepo.Create(ctx, feedback); err != nil {
		return nil, err
	}

	return feedback, nil
}
