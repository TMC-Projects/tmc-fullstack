package worker

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"njara-platform/internal/domain"
)

type VoteProcessor struct {
	cache    domain.CacheRepository
	voteRepo domain.PlayerVoteRepository
}

func NewVoteProcessor(cache domain.CacheRepository, voteRepo domain.PlayerVoteRepository) *VoteProcessor {
	return &VoteProcessor{
		cache:    cache,
		voteRepo: voteRepo,
	}
}

func (w *VoteProcessor) Start(ctx context.Context) {
	log.Println("Starting VoteProcessor worker...")
	for {
		select {
		case <-ctx.Done():
			log.Println("VoteProcessor shutting down...")
			return
		default:
			// Block and pop from queue, timeout after 5 seconds to allow context cancellation checks
			res, err := w.cache.BRPop(ctx, 5*time.Second, "queue:player_votes")
			if err != nil {
				// Redis BRPop returns redis.Nil on timeout, we just ignore and loop
				if err.Error() != "redis: nil" {
					log.Printf("VoteProcessor error reading from redis: %v\n", err)
					time.Sleep(1 * time.Second)
				}
				continue
			}

			// res is an array: [listName, element]
			if len(res) == 2 {
				payload := res[1]
				var vote domain.PlayerVote
				if err := json.Unmarshal([]byte(payload), &vote); err != nil {
					log.Printf("VoteProcessor error unmarshaling vote payload: %v\n", err)
					continue
				}

				// Process the vote
				if err := w.voteRepo.CreateVoteAndIncrement(ctx, vote.PlayerID, vote.CookieID, vote.IPAddress); err != nil {
					log.Printf("VoteProcessor error persisting vote to db: %v\n", err)
					// In a real app we might retry or DLQ this
				}
			}
		}
	}
}
