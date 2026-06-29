package postgres

import (
	"njara-platform/internal/domain"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type currencyRepository struct {
	db *gorm.DB
}

func NewCurrencyRepository(db *gorm.DB) domain.CurrencyRepository {
	return &currencyRepository{db: db}
}

func (r *currencyRepository) UpsertRate(code, toCode string, rate float64) error {
	currency := CurrencyModel{
		Code:   code,
		ToCode: toCode,
		Rate:   rate,
	}

	return r.db.Clauses(clause.OnConflict{
		Columns:   []clause.Column{{Name: "code"}, {Name: "to_code"}},
		DoUpdates: clause.AssignmentColumns([]string{"rate", "updated_at"}),
	}).Create(&currency).Error
}

func (r *currencyRepository) GetRate(code, toCode string) (*domain.Currency, error) {
	var model CurrencyModel
	if err := r.db.Where("code = ? AND to_code = ?", code, toCode).First(&model).Error; err != nil {
		return nil, err
	}

	return &domain.Currency{
		ID:        model.ID,
		Code:      model.Code,
		ToCode:    model.ToCode,
		Rate:      model.Rate,
		UpdatedAt: model.UpdatedAt,
	}, nil
}
