package postgres

import (
	"fmt"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Config holds the postgres connection parameters.
type Config struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	SSLMode  string
}

// NewDB initializes, connects and tunes the GORM database pool.
func NewDB(cfg Config) (*gorm.DB, error) {
	// Ensure target database exists before connecting to it
	if err := ensureDatabaseExists(cfg); err != nil {
		return nil, fmt.Errorf("failed to ensure database exists: %w", err)
	}

	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.DBName, cfg.SSLMode)

	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, fmt.Errorf("failed to open gorm db connection: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get standard sql.DB handle: %w", err)
	}

	// Connection pool tuning
	sqlDB.SetMaxOpenConns(25)
	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetConnMaxLifetime(5 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	// Verify connection
	if err := sqlDB.Ping(); err != nil {
		sqlDB.Close()
		return nil, fmt.Errorf("failed to ping db: %w", err)
	}

	return db, nil
}

func ensureDatabaseExists(cfg Config) error {
	// DSN connecting to default system "postgres" database
	systemDsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=postgres sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.SSLMode)

	db, err := gorm.Open(postgres.Open(systemDsn), &gorm.Config{})
	if err != nil {
		return fmt.Errorf("failed to connect to system postgres database: %w", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		return err
	}
	defer sqlDB.Close()

	// Check if database exists
	var exists bool
	checkQuery := fmt.Sprintf("SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = '%s')", cfg.DBName)
	if err := db.Raw(checkQuery).Scan(&exists).Error; err != nil {
		return fmt.Errorf("failed to query pg_database catalog: %w", err)
	}

	if !exists {
		createQuery := fmt.Sprintf("CREATE DATABASE %s", cfg.DBName)
		if err := db.Exec(createQuery).Error; err != nil {
			return fmt.Errorf("failed to execute CREATE DATABASE statement: %w", err)
		}
	}

	return nil
}
