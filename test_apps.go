package main

import (
	"encoding/json"
	"fmt"
	njara_postgres "njara-platform/internal/infrastructure/postgres"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func main() {
	dsn := "host=localhost user=postgres password=postgres dbname=njara port=5432 sslmode=disable"
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		fmt.Println("Error connecting to database:", err)
		return
	}

	var models []njara_postgres.TrialApplicationModel
	db.Preload("Trial").Preload("Player").Limit(2).Find(&models)
	b, _ := json.MarshalIndent(models, "", "  ")
	fmt.Println(string(b))
}
