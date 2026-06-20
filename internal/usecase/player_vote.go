package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"njara-platform/internal/domain"
)

type playerVoteUsecase struct {
	userRepo domain.UserRepository
	cache    domain.CacheRepository
}

// NewPlayerVoteUsecase creates a new instance of PlayerVoteUsecase.
func NewPlayerVoteUsecase(userRepo domain.UserRepository, cache domain.CacheRepository) domain.PlayerVoteUsecase {
	return &playerVoteUsecase{
		userRepo: userRepo,
		cache:    cache,
	}
}

func (u *playerVoteUsecase) Vote(ctx context.Context, playerID int64, cookieID, ipAddress string) error {
	// 1. Verify player exists and is a player/coach
	user, err := u.userRepo.GetByID(ctx, playerID)
	if err != nil {
		return err
	}
	if user == nil || (user.Category != "player" && user.Category != "coach") {
		return errors.New("invalid player ID")
	}

	// 2. Check Redis for existing IP or Cookie vote within 24h
	ipKey := fmt.Sprintf("vote:ip:%d:%s", playerID, ipAddress)
	cookieKey := fmt.Sprintf("vote:device:%d:%s", playerID, cookieID)

	ipExists, err := u.cache.Exists(ctx, ipKey)
	if err != nil {
		return err
	}
	if ipExists {
		return errors.New("already voted from this IP today")
	}

	cookieExists, err := u.cache.Exists(ctx, cookieKey)
	if err != nil {
		return err
	}
	if cookieExists {
		return errors.New("already voted from this device today")
	}

	// 3. Set Redis keys with 24h TTL
	ttl := 24 * time.Hour
	if err := u.cache.SetEx(ctx, ipKey, "1", ttl); err != nil {
		return err
	}
	if err := u.cache.SetEx(ctx, cookieKey, "1", ttl); err != nil {
		return err
	}

	// 4. Push to Redis queue for background processing
	vote := domain.PlayerVote{
		PlayerID:  playerID,
		CookieID:  cookieID,
		IPAddress: ipAddress,
		CreatedAt: time.Now(),
	}
	
	payload, err := json.Marshal(vote)
	if err != nil {
		return err
	}

	// We use "queue:player_votes" list
	if err := u.cache.LPush(ctx, "queue:player_votes", payload); err != nil {
		return err
	}

	return nil
}
