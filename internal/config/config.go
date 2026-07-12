package config

import (
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog/log"
)

// Config represents all application configuration parameters loaded from environment variables.
type Config struct {
	ServerPort string

	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSslMode  string

	RedisAddr     string
	RedisPassword string

	JWTSecret string
	JWTTTL    time.Duration

	MidtransMerchantID string
	MidtransClientKey  string
	MidtransServerKey  string

	GlobalAPIKey string

	MinioEndpoint  string
	MinioAccessKey string
	MinioSecretKey string
	MinioUseSSL    bool
	MinioBucket    string
	MinioPublicURL string
}

// LoadConfig reads variables from environment or returns defaults.
func LoadConfig() Config {
	if err := godotenv.Load(); err != nil {
		log.Info().Msg("No .env file found, relying on system environment variables.")
	}

	port := getEnv("PORT", "8080")

	dbHost := getEnv("DB_HOST", "localhost")
	dbPortStr := getEnv("DB_PORT", "5432")
	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		dbPort = 5432
	}
	dbUser := getEnv("DB_USER", "postgres")
	dbPassword := getEnv("DB_PASSWORD", "postgres")
	dbName := getEnv("DB_NAME", "njara")
	dbSslMode := getEnv("DB_SSLMODE", "disable")

	redisAddr := getEnv("REDIS_ADDR", "localhost:6379")
	redisPassword := getEnv("REDIS_PASSWORD", "")

	jwtSecret := getEnv("JWT_SECRET", "super_secret_njara_key")
	jwtTTLStr := getEnv("JWT_TTL", "1h")
	jwtTTL, err := time.ParseDuration(jwtTTLStr)
	if err != nil {
		jwtTTL = 1 * time.Hour
	}

	midtransMerchantID := getEnv("MIDTRANS_MERCHANT_ID", "")
	midtransClientKey := getEnv("MIDTRANS_CLIENT_KEY", "")
	midtransServerKey := getEnv("MIDTRANS_SERVER_KEY", "")

	minioEndpoint := getEnv("MINIO_ENDPOINT", "localhost:9000")
	minioEndpoint = strings.TrimPrefix(minioEndpoint, "http://")
	minioEndpoint = strings.TrimPrefix(minioEndpoint, "https://")
	minioAccessKey := getEnv("MINIO_ACCESS_KEY", "minioadmin")
	minioSecretKey := getEnv("MINIO_SECRET_KEY", "minioadmin")
	minioUseSSLStr := getEnv("MINIO_USE_SSL", "false")
	minioUseSSL, err := strconv.ParseBool(minioUseSSLStr)
	if err != nil {
		minioUseSSL = false
	}
	minioBucket := getEnv("MINIO_BUCKET", "njara-uploads")
	minioPublicURL := getEnv("MINIO_PUBLIC_URL", "http://localhost:9000")

	return Config{
		ServerPort:    port,
		DBHost:        dbHost,
		DBPort:        dbPort,
		DBUser:        dbUser,
		DBPassword:    dbPassword,
		DBName:        dbName,
		DBSslMode:     dbSslMode,
		RedisAddr:     redisAddr,
		RedisPassword: redisPassword,
		JWTSecret:     jwtSecret,
		JWTTTL:        jwtTTL,

		MidtransMerchantID: midtransMerchantID,
		MidtransClientKey:  midtransClientKey,
		MidtransServerKey:  midtransServerKey,
		GlobalAPIKey:       getEnv("GLOBAL_API_KEY", "default_global_key"),

		MinioEndpoint:  minioEndpoint,
		MinioAccessKey: minioAccessKey,
		MinioSecretKey: minioSecretKey,
		MinioUseSSL:    minioUseSSL,
		MinioBucket:    minioBucket,
		MinioPublicURL: minioPublicURL,
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}
