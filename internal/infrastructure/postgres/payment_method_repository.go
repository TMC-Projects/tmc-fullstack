package postgres

import (
	"errors"

	"gorm.io/gorm"
	"njara-platform/internal/domain"
)

type paymentMethodRepository struct {
	db *gorm.DB
}

// NewPaymentMethodRepository creates a new PaymentMethodRepository.
func NewPaymentMethodRepository(db *gorm.DB) domain.PaymentMethodRepository {
	return &paymentMethodRepository{db: db}
}

func (r *paymentMethodRepository) GetActivePaymentMethods() ([]domain.PaymentMethod, error) {
	var models []PaymentMethodModel
	if err := r.db.Where("is_active = ?", true).Find(&models).Error; err != nil {
		return nil, err
	}
	var methods []domain.PaymentMethod
	for _, m := range models {
		methods = append(methods, m.ToDomain())
	}
	return methods, nil
}

func (r *paymentMethodRepository) GetByCode(code string) (*domain.PaymentMethod, error) {
	var model PaymentMethodModel
	if err := r.db.Where("code = ?", code).First(&model).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, domain.NewAppError(domain.ErrCodeNotFound, "payment method not found", nil)
		}
		return nil, err
	}
	domainMethod := model.ToDomain()
	return &domainMethod, nil
}
