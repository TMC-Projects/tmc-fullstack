package usecase

import (
	"context"
	"fmt"
	"njara-platform/internal/domain"
)

type userUsecase struct {
	userRepo domain.UserRepository
}

// UserUsecase defines the interface for user-related business logic.
type UserUsecase interface {
	GetUsersByCategoryAndClub(ctx context.Context, category string, clubID int64) ([]*domain.User, error)
}

// NewUserUsecase creates a new instance of UserUsecase.
func NewUserUsecase(userRepo domain.UserRepository) UserUsecase {
	return &userUsecase{
		userRepo: userRepo,
	}
}

// GetUsersByCategoryAndClub fetches all users of a specific category within a specific club.
func (u *userUsecase) GetUsersByCategoryAndClub(ctx context.Context, category string, clubID int64) ([]*domain.User, error) {
	users, err := u.userRepo.GetByCategoryAndClub(ctx, category, clubID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve users for category %s: %w", category, err)
	}
	return users, nil
}
