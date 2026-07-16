package usecase

import (
	"njara-platform/internal/domain"
)

type paymentMethodUsecase struct {
	repo domain.PaymentMethodRepository
}

// NewPaymentMethodUsecase creates a new PaymentMethodUsecase.
func NewPaymentMethodUsecase(repo domain.PaymentMethodRepository) domain.PaymentMethodUsecase {
	return &paymentMethodUsecase{repo: repo}
}

func (u *paymentMethodUsecase) GetActivePaymentMethods() ([]domain.PaymentMethod, error) {
	methods, err := u.repo.GetActivePaymentMethods()
	if err != nil {
		return nil, domain.NewAppError(domain.ErrCodeInternal, "failed to get payment methods", err)
	}
	return methods, nil
}
