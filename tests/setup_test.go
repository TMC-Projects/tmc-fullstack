// Package tests contains integration tests for all API endpoints.
// These tests require a running PostgreSQL and Redis instance (configured via .env).
// Test data is cleaned up automatically after all tests complete.
package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"
	"time"

	"github.com/gofiber/fiber/v2"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"njara-platform/internal/config"
	"njara-platform/internal/domain"
	redisCache "njara-platform/internal/infrastructure/cache"
	domainhttp "njara-platform/internal/infrastructure/http"
	"njara-platform/internal/infrastructure/postgres"
	"njara-platform/internal/infrastructure/security"
	"njara-platform/internal/usecase"
)

// testApp holds the shared Fiber app instance and DB for all tests.
var (
	testApp   *fiber.App
	testDB    *gorm.DB
	testRedis *redis.Client
)

// createdUserEmails tracks test user emails for cleanup after all tests.
var createdUserEmails []string

// mockStorageService is a mock implementation of domain.StorageService for tests.
type mockStorageService struct{}

func (m *mockStorageService) UploadFile(ctx context.Context, file io.Reader, size int64, contentType, objectName string) (string, error) {
	return "http://mock-url.com/" + objectName, nil
}

// TestMain is the entry point for all tests in this package.
// It bootstraps the full application (same as main.go) and tears it down after.
func TestMain(m *testing.M) {
	// Load config from .env (located two dirs up from tests/)
	if err := os.Chdir(".."); err != nil {
		panic(fmt.Sprintf("failed to chdir to project root: %v", err))
	}

	cfg := config.LoadConfig()

	// Setup Database
	dbCfg := postgres.Config{
		Host:     cfg.DBHost,
		Port:     cfg.DBPort,
		User:     cfg.DBUser,
		Password: cfg.DBPassword,
		DBName:   cfg.DBName,
		SSLMode:  cfg.DBSslMode,
	}

	db, err := postgres.NewDB(dbCfg)
	if err != nil {
		panic(fmt.Sprintf("failed to connect to database: %v", err))
	}
	testDB = db

	// Setup Redis
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       0,
	})

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		// Redis failure is non-fatal; cache operations degrade gracefully
		fmt.Printf("Warning: failed to connect to redis: %v. Cache will be degraded.\n", err)
	} else {
		testRedis = rdb
	}

	// Run migrations and seed (idempotent)
	if err := migrateAndSeedDB(db); err != nil {
		panic(fmt.Sprintf("failed to migrate/seed database: %v", err))
	}

	// Initialize adapters & services (mirrors main.go wiring)
	passwordHasher := security.NewPasswordHasher()
	tokenProvider := security.NewTokenProvider(cfg.JWTSecret, cfg.JWTTTL)

	userRepo := postgres.NewUserRepository(db)
	clubRepo := postgres.NewClubRepository(db)
	cacheRepo := redisCache.NewRedisCache(rdb)
	gameRepo := postgres.NewGameRepository(db)
	rolePermRepo := postgres.NewRolePermissionRepository(db)
	transferMarketRepo := postgres.NewTransferMarketRepository(db)
	accessLogRepo := postgres.NewAccessLogRepository(db)

	authUsecase := usecase.NewAuthUsecase(userRepo, clubRepo, cacheRepo, passwordHasher, tokenProvider, 15*time.Minute, transferMarketRepo)
	gameUsecase := usecase.NewGameUsecase(gameRepo)
	invRepo := postgres.NewTeamInvitationRepository(db)
	transferMarketUsecase := usecase.NewTransferMarketUsecase(transferMarketRepo, cacheRepo, userRepo, authUsecase, invRepo)
	userUsecase := usecase.NewUserUsecase(userRepo)
	clubUsecase := usecase.NewClubUsecase(clubRepo, userRepo, rolePermRepo, cacheRepo)

	mockStorage := &mockStorageService{}
	authHandler := domainhttp.NewAuthHandler(authUsecase, mockStorage)
	gameHandler := domainhttp.NewGameHandler(gameUsecase)
	transferMarketHandler := domainhttp.NewTransferMarketHandler(transferMarketUsecase)
	userHandler := domainhttp.NewUserHandler(userUsecase, authUsecase)
	clubHandler := domainhttp.NewClubHandler(clubUsecase, mockStorage)
	invUsecase := usecase.NewTeamInvitationUsecase(invRepo, userRepo, transferMarketRepo, cacheRepo)
	invHandler := domainhttp.NewTeamInvitationHandler(invUsecase)

	talentUsecase := usecase.NewTalentUsecase(userRepo, authUsecase, transferMarketRepo, cacheRepo, invRepo)
	talentHandler := domainhttp.NewTalentHandler(talentUsecase, mockStorage)

	userFollowRepo := postgres.NewUserFollowRepository(db)
	userFollowUsecase := usecase.NewUserFollowUsecase(userFollowRepo, userRepo)
	userFollowHandler := domainhttp.NewUserFollowHandler(userFollowUsecase)
	b2cPlayerHandler := domainhttp.NewB2CPlayerHandler(authUsecase, userFollowUsecase)

	feedbackRepo := postgres.NewFeedbackRepository(db)
	feedbackUsecase := usecase.NewFeedbackUsecase(feedbackRepo)
	feedbackHandler := domainhttp.NewFeedbackHandler(feedbackUsecase)

	authMiddleware := domainhttp.NewAuthMiddleware(tokenProvider, authUsecase, rolePermRepo, clubRepo, "test_global_api_key_123", accessLogRepo)

	// Setup Fiber app — identical routing to main.go
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true,
		ErrorHandler:          domainhttp.GlobalErrorHandler,
	})

	app.Post("/api/register", authHandler.Register)
	app.Post("/api/login", authHandler.Login)
	app.Get("/api/profile", authMiddleware.Authenticate, authHandler.GetProfile)
	app.Get("/api/games", gameHandler.GetList)
	app.Get("/api/transfer-market", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("view_transfer_market"), transferMarketHandler.GetList)

	app.Post("/api/clubs", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), clubHandler.Create)
	app.Put("/api/clubs/:id", authMiddleware.Authenticate, clubHandler.Update)
	app.Get("/api/clubs/:id", authMiddleware.Authenticate, clubHandler.GetByID)
	app.Post("/api/clubs/:id/achievements", authMiddleware.Authenticate, clubHandler.AddAchievement)
	app.Put("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, clubHandler.UpdateAchievement)
	app.Delete("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, clubHandler.DeleteAchievement)

	app.Get("/api/players", authMiddleware.Authenticate, userHandler.GetListByCategory("player"))
	app.Get("/api/coaches", authMiddleware.Authenticate, userHandler.GetListByCategory("coach"))
	app.Get("/api/owners", authMiddleware.Authenticate, userHandler.GetListByCategory("owner"))
	app.Get("/api/staff", authMiddleware.Authenticate, userHandler.GetListByCategory("staff"))
	app.Get("/api/ba", authMiddleware.Authenticate, userHandler.GetListByCategory("ba"))

	app.Post("/api/talents", authMiddleware.Authenticate, authMiddleware.RequirePermission("manage_talents"), talentHandler.RegisterTalent)
	app.Post("/api/talents/:id/sign", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.SignFreeAgent)

	// B2C Player & Follow Endpoints
	app.Get("/api/b2c/players/:id", authMiddleware.Authenticate, b2cPlayerHandler.GetB2CPlayerDetail)
	app.Post("/api/b2c/users/:id/follow", authMiddleware.Authenticate, userFollowHandler.Follow)
	app.Delete("/api/b2c/users/:id/unfollow", authMiddleware.Authenticate, userFollowHandler.Unfollow)
	app.Get("/api/b2c/users/:id/follow-status", authMiddleware.Authenticate, userFollowHandler.FollowStatus)
	app.Post("/api/b2c/feedback", authMiddleware.Authenticate, feedbackHandler.Create)
	app.Get("/api/b2c/invitations", authMiddleware.Authenticate, invHandler.GetMyInvitations)
	app.Post("/api/b2c/invitations/:id/respond", authMiddleware.Authenticate, invHandler.Respond)

	app.Get("/api/test/player", authMiddleware.Authenticate, authMiddleware.RequirePermission("edit_portfolio"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Player! You have 'edit_portfolio' permission.", nil)
	})
	app.Get("/api/test/coach", authMiddleware.Authenticate, authMiddleware.RequirePermission("manage_teams"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Coach! You have 'manage_teams' permission.", nil)
	})
	app.Get("/api/test/manager", authMiddleware.Authenticate, authMiddleware.RequirePermission("manage_club"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Manager! You have 'manage_club' permission.", nil)
	})

	testApp = app

	// Run all tests
	code := m.Run()

	// Teardown: delete test users created during tests
	cleanupTestUsers()

	os.Exit(code)
}

// migrateAndSeedDB runs GORM auto-migrations and seeds required data.
// This mirrors the migrateAndSeedDB function in main.go exactly.
func migrateAndSeedDB(db *gorm.DB) error {
	db.Exec("DROP TABLE IF EXISTS club_achievements CASCADE;")
	db.Exec("TRUNCATE TABLE transfer_market, role_permissions, users, club_achievements CASCADE;")
	if testRedis != nil {
		testRedis.FlushAll(context.Background())
	}
	err := db.AutoMigrate(
		&postgres.ClubModel{},
		&postgres.ClubAchievementModel{},
		&postgres.UserModel{},
		&postgres.GameModel{},
		&postgres.RolePermissionModel{},
		&postgres.TransferMarketModel{},
		&postgres.AccessLogModel{},
		&domain.ClubOnboarding{},
		&postgres.FeedbackModel{},
		&postgres.TeamInvitationModel{},
	)
	if err != nil {
		return err
	}

	// Seed "Free Agent" club
	var count int64
	if err := db.Model(&postgres.ClubModel{}).Where("name = ?", "Free Agent").Count(&count).Error; err != nil {
		return err
	}
	if count == 0 {
		if err := db.Create(&postgres.ClubModel{Name: "Free Agent"}).Error; err != nil {
			return err
		}
	}

	// Seed games
	games := []string{"Mobile Legend", "Honor Of Kings", "PUBG Mobile", "Free Fire", "Delta Force", "eFootball", "FC Mobile", "Pokemon United"}
	for _, gName := range games {
		var gCount int64
		if err := db.Model(&postgres.GameModel{}).Where("name = ?", gName).Count(&gCount).Error; err != nil {
			return err
		}
		if gCount == 0 {
			if err := db.Create(&postgres.GameModel{Name: gName}).Error; err != nil {
				return err
			}
		}
	}

	// Seed RBAC role permissions
	rolePermissions := []struct{ Category, Permission string }{
		{"player", "edit_portfolio"},
		{"player", "view_stats"},
		{"coach", "manage_teams"},
		{"coach", "view_analytics"},
		{"manager", "manage_club"},
		{"manager", "manage_teams"},
		{"manager", "view_analytics"},
		{"manager", "view_transfer_market"},
		{"manager", "manage_talents"},
		{"owner", "view_transfer_market"},
		{"owner", "manage_club"},
		{"owner", "manage_teams"},
		{"owner", "view_analytics"},
		{"owner", "manage_talents"},
	}
	for _, rp := range rolePermissions {
		var rpCount int64
		if err := db.Model(&postgres.RolePermissionModel{}).
			Where("category = ? AND permission = ?", rp.Category, rp.Permission).
			Count(&rpCount).Error; err != nil {
			return err
		}
		if rpCount == 0 {
			if err := db.Create(&postgres.RolePermissionModel{Category: rp.Category, Permission: rp.Permission}).Error; err != nil {
				return err
			}
		}
	}

	return nil
}

// cleanupTestUsers removes all test user records created during testing.
func cleanupTestUsers() {
	if testDB == nil {
		return
	}
	testDB.Exec("DROP TABLE IF EXISTS club_achievements CASCADE;")
	testDB.Exec("TRUNCATE TABLE transfer_market, role_permissions, users, club_achievements CASCADE;")
}

// trackTestUser registers an email to be deleted in teardown.
func trackTestUser(email string) {
	createdUserEmails = append(createdUserEmails, email)
}

// uniqueEmail generates a unique email address for each test run.
func uniqueEmail(prefix string) string {
	return fmt.Sprintf("%s_%d_%d@test.njara.io", prefix, time.Now().UnixNano(), rand.Intn(9999))
}

// uniqueUsername generates a unique username for each test run.
func uniqueUsername(prefix string) string {
	return fmt.Sprintf("%s_%d", prefix, time.Now().UnixNano())
}

// doRequest is a helper to build and fire an HTTP request against the test app.
func doRequest(method, path string, body interface{}, token string) (*http.Response, []byte, error) {
	var reqBody io.Reader
	if body != nil {
		b, err := json.Marshal(body)
		if err != nil {
			return nil, nil, fmt.Errorf("failed to marshal request body: %w", err)
		}
		reqBody = bytes.NewReader(b)
	}

	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	resp, err := testApp.Test(req, 10000) // 10s timeout
	if err != nil {
		return nil, nil, fmt.Errorf("test request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read response body: %w", err)
	}

	return resp, respBody, nil
}

// registerTestUser is a convenience helper that registers a user and returns the token.
// The email is tracked automatically for cleanup.
func registerTestUser(t *testing.T, category string) (token string, email string) {
	t.Helper()
	email = uniqueEmail(category)
	username := uniqueUsername(category)
	trackTestUser(email)

	payload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  "TestPassword123!",
		"full_name": "Test " + category,
		"category":  category,
	}

	resp, body, err := doRequest("POST", "/api/register", payload, "")
	if err != nil {
		t.Fatalf("registerTestUser: request error: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("registerTestUser: expected 201, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("registerTestUser: failed to unmarshal response: %v", err)
	}

	result, ok := wrapper["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("registerTestUser: expected 'data' object. Body: %s", body)
	}

	tokenVal, ok := result["token"].(string)
	if !ok || tokenVal == "" {
		t.Fatalf("registerTestUser: token not found in response. Body: %s", body)
	}

	return tokenVal, email
}

// makeRequestWithCustomHeader builds an http.Request with a custom Authorization header value.
// Used for testing malformed auth header formats.
func makeRequestWithCustomHeader(method, path string, body interface{}, authHeader string) *http.Request {
	var reqBody io.Reader
	if body != nil {
		b, _ := json.Marshal(body)
		reqBody = bytes.NewReader(b)
	}
	req := httptest.NewRequest(method, path, reqBody)
	req.Header.Set("Content-Type", "application/json")
	if authHeader != "" {
		req.Header.Set("Authorization", authHeader)
	}
	return req
}

// executeRawRequest fires a pre-built *http.Request against the test app and returns the response.
func executeRawRequest(req *http.Request) (*http.Response, []byte, error) {
	resp, err := testApp.Test(req, 10000)
	if err != nil {
		return nil, nil, fmt.Errorf("test request failed: %w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read response body: %w", err)
	}
	return resp, respBody, nil
}
