package domain

import "time"

type Currency struct {
	ID        uint      `json:"id"`
	Code      string    `json:"code"`
	ToCode    string    `json:"to_code"`
	Rate      float64   `json:"rate"`
	UpdatedAt time.Time `json:"updated_at"`
}

type CurrencyRepository interface {
	UpsertRate(code, toCode string, rate float64) error
	GetRate(code, toCode string) (*Currency, error)
}
