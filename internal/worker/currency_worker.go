package worker

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"njara-platform/internal/domain"

	"github.com/rs/zerolog/log"
)

type CurrencyWorker struct {
	repo domain.CurrencyRepository
}

func NewCurrencyWorker(repo domain.CurrencyRepository) *CurrencyWorker {
	return &CurrencyWorker{
		repo: repo,
	}
}

func (w *CurrencyWorker) Start(ctx context.Context) {
	// Run immediately on startup to ensure we have the latest rate
	w.fetchAndSaveRate()

	for {
		now := time.Now()
		// Calculate next 5:00 AM
		next := time.Date(now.Year(), now.Month(), now.Day(), 5, 0, 0, 0, now.Location())
		if now.After(next) {
			// If it's already past 5 AM today, schedule for 5 AM tomorrow
			next = next.Add(24 * time.Hour)
		}

		duration := next.Sub(now)
		log.Info().Msgf("CurrencyWorker scheduled to run in %v (at %v)", duration, next)

		timer := time.NewTimer(duration)
		
		select {
		case <-ctx.Done():
			timer.Stop()
			log.Info().Msg("CurrencyWorker shutting down")
			return
		case <-timer.C:
			w.fetchAndSaveRate()
		}
	}
}

type exchangeRateResponse struct {
	Rates map[string]float64 `json:"rates"`
}

func (w *CurrencyWorker) fetchAndSaveRate() {
	log.Info().Msg("CurrencyWorker: fetching USD to IDR rate...")
	
	resp, err := http.Get("https://api.exchangerate-api.com/v4/latest/USD")
	if err != nil {
		log.Error().Err(err).Msg("CurrencyWorker: failed to fetch exchange rates")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		log.Error().Msgf("CurrencyWorker: received non-200 status code: %d", resp.StatusCode)
		return
	}

	var result exchangeRateResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		log.Error().Err(err).Msg("CurrencyWorker: failed to decode response JSON")
		return
	}

	idrRate, ok := result.Rates["IDR"]
	if !ok {
		log.Error().Msg("CurrencyWorker: IDR rate not found in response")
		return
	}

	if err := w.repo.UpsertRate("USD", "IDR", idrRate); err != nil {
		log.Error().Err(err).Msg("CurrencyWorker: failed to save rate to database")
		return
	}

	log.Info().Msgf("CurrencyWorker: successfully updated USD to IDR rate to %.2f", idrRate)
}
