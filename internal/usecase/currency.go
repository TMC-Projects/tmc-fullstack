package usecase

import (
	"njara-platform/internal/domain"
)

type CurrencyUsecase struct {
	repo domain.CurrencyRepository
}

func NewCurrencyUsecase(repo domain.CurrencyRepository) *CurrencyUsecase {
	return &CurrencyUsecase{
		repo: repo,
	}
}

func (u *CurrencyUsecase) GetExchangeRate(code, toCode string) (*domain.Currency, error) {
	return u.repo.GetRate(code, toCode)
}
