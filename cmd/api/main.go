package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"njara-platform/internal/config"
	"njara-platform/internal/domain"
	redisCache "njara-platform/internal/infrastructure/cache"
	domainhttp "njara-platform/internal/infrastructure/http"
	midtransInfra "njara-platform/internal/infrastructure/midtrans"
	"njara-platform/internal/infrastructure/postgres"
	"njara-platform/internal/infrastructure/security"
	"njara-platform/internal/infrastructure/storage"
	"njara-platform/internal/usecase"
	"njara-platform/internal/worker"

	"github.com/gofiber/contrib/fiberzerolog"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
	"github.com/gofiber/fiber/v2/middleware/limiter"
	"github.com/gofiber/fiber/v2/middleware/requestid"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gorm.io/gorm"
)

func main() {
	// Ensure logs directory exists
	if err := os.MkdirAll("logs", 0755); err != nil {
		fmt.Printf("failed to create logs directory: %v\n", err)
		os.Exit(1)
	}

	// Ensure uploads directory exists
	if err := os.MkdirAll("./uploads/profiles", 0755); err != nil {
		fmt.Printf("failed to create uploads/profiles directory: %v\n", err)
		os.Exit(1)
	}
	if err := os.MkdirAll("./uploads/clubs", 0755); err != nil {
		fmt.Printf("failed to create uploads/clubs directory: %v\n", err)
		os.Exit(1)
	}
	if err := os.MkdirAll("./uploads/teams", 0755); err != nil {
		fmt.Printf("failed to create uploads/teams directory: %v\n", err)
		os.Exit(1)
	}
	if err := os.MkdirAll("./uploads/posts", 0755); err != nil {
		fmt.Printf("failed to create uploads/posts directory: %v\n", err)
		os.Exit(1)
	}

	// Create daily log file
	logFileName := fmt.Sprintf("logs/%s.log", time.Now().Format("2006-01-02"))
	logFile, err := os.OpenFile(logFileName, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		fmt.Printf("failed to open log file: %v\n", err)
		os.Exit(1)
	}
	defer logFile.Close() // Will close when main exits

	// Write to both console and file
	multiWriter := zerolog.MultiLevelWriter(
		zerolog.ConsoleWriter{Out: os.Stderr, TimeFormat: time.RFC3339},
		logFile,
	)
	log.Logger = log.Output(multiWriter)

	log.Info().Msg("Starting api server using GoFiber and GORM...")

	// 1. Load config
	cfg := config.LoadConfig()

	// 2. Setup Database
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
		log.Fatal().Msgf("failed to connect to database: %v", err)
	}

	// 3. Migrate and Seed DB
	if err := migrateAndSeedDB(db); err != nil {
		log.Fatal().Msgf("failed to migrate/seed database: %v", err)
	}
	log.Info().Msg("Database migrated and seeded successfully.")

	// 4. Setup Redis Cache
	rdb := redis.NewClient(&redis.Options{
		Addr:     cfg.RedisAddr,
		Password: cfg.RedisPassword,
		DB:       0,
	})

	// Test Redis connection
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Warn().Msgf("Warning: failed to connect to redis on startup: %v. Cache operations will degrade gracefully.", err)
	} else {
		log.Info().Msg("Redis connected successfully.")
	}

	// 5. Initialize Adapters & Services
	passwordHasher := security.NewPasswordHasher()
	tokenProvider := security.NewTokenProvider(cfg.JWTSecret, cfg.JWTTTL)

	userRepo := postgres.NewUserRepository(db)
	clubRepo := postgres.NewClubRepository(db)
	cacheRepo := redisCache.NewRedisCache(rdb)
	gameRepo := postgres.NewGameRepository(db)
	rolePermRepo := postgres.NewRolePermissionRepository(db)
	transferMarketRepo := postgres.NewTransferMarketRepository(db)
	invRepo := postgres.NewTeamInvitationRepository(db)

	// Trial Management Repositories
	trialRepo := postgres.NewTrialRepository(db)
	trialAppRepo := postgres.NewTrialApplicationRepository(db)
	trialParticipantRepo := postgres.NewTrialParticipantRepository(db)
	assessmentCriteriaRepo := postgres.NewAssessmentCriteriaRepository(db)
	assessmentResultRepo := postgres.NewAssessmentResultRepository(db)
	assessmentScoreRepo := postgres.NewAssessmentScoreRepository(db)
	recruitmentDecisionRepo := postgres.NewRecruitmentDecisionRepository(db)
	userProfileRepo := postgres.NewUserProfileRepository(db)
	accessLogRepo := postgres.NewAccessLogRepository(db)
	playerVoteRepo := postgres.NewPlayerVoteRepository(db)
	currencyRepo := postgres.NewCurrencyRepository(db)
	feedbackRepo := postgres.NewFeedbackRepository(db)
	postRepo := postgres.NewPostRepository(db)

	authUsecase := usecase.NewAuthUsecase(userRepo, clubRepo, cacheRepo, passwordHasher, tokenProvider, 15*time.Minute, transferMarketRepo)
	gameUsecase := usecase.NewGameUsecase(gameRepo)
	transferMarketUsecase := usecase.NewTransferMarketUsecase(transferMarketRepo, cacheRepo, userRepo, authUsecase, invRepo)
	userUsecase := usecase.NewUserUsecase(userRepo)
	clubUsecase := usecase.NewClubUsecase(clubRepo, userRepo, rolePermRepo, cacheRepo)
	teamRepo := postgres.NewTeamRepository(db)
	teamUsecase := usecase.NewTeamUsecase(teamRepo, userRepo)

	// Trial Management Usecases
	b2cSubRepo := postgres.NewB2CSubscriptionRepository(db)

	trialUsecase := usecase.NewTrialUsecase(trialRepo, userRepo, clubRepo)
	trialAppUsecase := usecase.NewTrialApplicationUsecase(trialAppRepo, trialRepo, trialParticipantRepo, userRepo, b2cSubRepo)
	trialParticipantUsecase := usecase.NewTrialParticipantUsecase(trialParticipantRepo, trialRepo, userRepo)
	assessmentResultUsecase := usecase.NewAssessmentResultUsecase(assessmentResultRepo, trialParticipantRepo, trialRepo, userRepo)
	assessmentScoreUsecase := usecase.NewAssessmentScoreUsecase(assessmentScoreRepo, assessmentResultRepo, assessmentCriteriaRepo, userRepo)
	recruitmentDecisionUsecase := usecase.NewRecruitmentDecisionUsecase(recruitmentDecisionRepo, trialParticipantRepo, trialRepo, userRepo, trialAppRepo)
	userProfileUsecase := usecase.NewUserProfileUsecase(userProfileRepo, cacheRepo, b2cSubRepo)
	playerVoteUsecase := usecase.NewPlayerVoteUsecase(userRepo, cacheRepo)

	// Follow System
	userFollowRepo := postgres.NewUserFollowRepository(db)
	userFollowUsecase := usecase.NewUserFollowUsecase(userFollowRepo, userRepo)

	// Post System
	postUsecase := usecase.NewPostUsecase(postRepo)

	// Midtrans
	midtransClient := midtransInfra.NewClient(cfg.MidtransServerKey, cfg.MidtransMerchantID)

	// Subscription
	subPlanRepo := postgres.NewSubscriptionPlanRepository(db)
	subRepo := postgres.NewSubscriptionRepository(db)
	
	// Payment Methods
	paymentMethodRepo := postgres.NewPaymentMethodRepository(db)
	paymentMethodUsecase := usecase.NewPaymentMethodUsecase(paymentMethodRepo)
	paymentMethodHandler := domainhttp.NewPaymentMethodHandler(paymentMethodUsecase)

	subUsecase := usecase.NewSubscriptionUsecase(subRepo, subPlanRepo, clubRepo, userRepo, midtransClient, paymentMethodRepo)
	subHandler := domainhttp.NewSubscriptionHandler(subUsecase)

	// B2C Subscription
	b2cSubUsecase := usecase.NewB2CSubscriptionUsecase(b2cSubRepo, userRepo, midtransClient, paymentMethodRepo)
	b2cSubHandler := domainhttp.NewB2CSubscriptionHandler(b2cSubUsecase)

	// Storage
	minioStorage, err := storage.NewMinioStorageService(cfg)
	if err != nil {
		log.Warn().Msgf("Warning: failed to initialize MinIO storage service: %v", err)
	} else {
		log.Info().Msg("MinIO Storage initialized successfully.")
	}

	authHandler := domainhttp.NewAuthHandler(authUsecase, minioStorage)
	gameHandler := domainhttp.NewGameHandler(gameUsecase)
	transferMarketHandler := domainhttp.NewTransferMarketHandler(transferMarketUsecase)
	userHandler := domainhttp.NewUserHandler(userUsecase, authUsecase)
	clubHandler := domainhttp.NewClubHandler(clubUsecase, minioStorage)
	teamHandler := domainhttp.NewTeamHandler(teamUsecase, minioStorage)

	invUsecase := usecase.NewTeamInvitationUsecase(invRepo, userRepo, transferMarketRepo, cacheRepo)
	invHandler := domainhttp.NewTeamInvitationHandler(invUsecase)

	talentUsecase := usecase.NewTalentUsecase(userRepo, authUsecase, transferMarketRepo, cacheRepo, invRepo)
	talentHandler := domainhttp.NewTalentHandler(talentUsecase, minioStorage)
	playerVoteHandler := domainhttp.NewPlayerVoteHandler(playerVoteUsecase)

	currencyUsecase := usecase.NewCurrencyUsecase(currencyRepo)
	currencyHandler := domainhttp.NewCurrencyHandler(currencyUsecase)

	feedbackUsecase := usecase.NewFeedbackUsecase(feedbackRepo)
	feedbackHandler := domainhttp.NewFeedbackHandler(feedbackUsecase)

	// B2C Handlers
	userFollowHandler := domainhttp.NewUserFollowHandler(userFollowUsecase)
	b2cPlayerHandler := domainhttp.NewB2CPlayerHandler(authUsecase, userFollowUsecase)
	b2cInvitationHandler := invHandler
	postHandler := domainhttp.NewPostHandler(postUsecase, minioStorage)

	// Trial Management Handlers
	trialHandler := domainhttp.NewTrialHandler(trialUsecase, trialAppRepo)
	trialAppHandler := domainhttp.NewTrialApplicationHandler(trialAppUsecase)
	trialParticipantHandler := domainhttp.NewTrialParticipantHandler(trialParticipantUsecase)
	assessmentResultHandler := domainhttp.NewAssessmentResultHandler(assessmentResultUsecase)
	assessmentScoreHandler := domainhttp.NewAssessmentScoreHandler(assessmentScoreUsecase)
	recruitmentDecisionHandler := domainhttp.NewRecruitmentDecisionHandler(recruitmentDecisionUsecase)
	userProfileHandler := domainhttp.NewUserProfileHandler(userProfileUsecase)
	assessmentCriteriaHandler := domainhttp.NewAssessmentCriteriaHandler(assessmentCriteriaRepo)

	accessLogUsecase := usecase.NewAccessLogUsecase(accessLogRepo)
	accessLogHandler := domainhttp.NewAccessLogHandler(accessLogUsecase)

	authMiddleware := domainhttp.NewAuthMiddleware(tokenProvider, authUsecase, rolePermRepo, clubRepo, cfg.GlobalAPIKey, accessLogRepo)

	// Background Workers
	voteProcessor := worker.NewVoteProcessor(cacheRepo, playerVoteRepo)
	go voteProcessor.Start(context.Background())

	currencyWorker := worker.NewCurrencyWorker(currencyRepo)
	go currencyWorker.Start(context.Background())

	// 6. Router Setup (GoFiber)
	app := fiber.New(fiber.Config{
		DisableStartupMessage: true, // We have our own startup log
		ErrorHandler:          domainhttp.GlobalErrorHandler,
	})

	app.Use(cors.New(cors.Config{
		AllowOrigins: "*",
		AllowHeaders: "Origin, Content-Type, Accept, Authorization, X-API-Key",
		AllowMethods: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
	}))

	rateLimiter := limiter.New(limiter.Config{
		Max:        1000,            // Maksimal request per IP
		Expiration: 1 * time.Minute, // Reset limit setiap 1 menit
		KeyGenerator: func(c *fiber.Ctx) string {
			// Menggunakan IP client sebagai identifier
			return c.IP()
		},
		LimitReached: func(c *fiber.Ctx) error {
			return c.Status(fiber.StatusTooManyRequests).JSON(fiber.Map{
				"success": false,
				"message": "Too many requests, please try again later.",
			})
		},
	})

	app.Use(rateLimiter)

	app.Use(requestid.New(requestid.Config{
		Generator: func() string {
			return uuid.New().String()
		},
	}))
	app.Use(fiberzerolog.New(fiberzerolog.Config{
		Logger: &log.Logger,
		Fields: []string{"requestId", "ip", "latency", "status", "method", "url", "error"},
	}))

	// Attach custom access log middleware for database tracing
	app.Use(authMiddleware.AccessLogMiddleware())

	// Serve static files
	app.Static("/uploads", "./uploads", fiber.Static{
		Browse: false,
	})

	// Global Endpoints (API Key only — no JWT required)
	app.Get("/api/global/clubs", authMiddleware.RequireAPIKey(), clubHandler.GetClubs)
	app.Get("/api/global/clubs/:id", authMiddleware.RequireAPIKey(), clubHandler.GetClubDetail)
	app.Get("/api/global/trials", authMiddleware.RequireAPIKey(), trialHandler.GetList)
	app.Get("/api/global/transfer-market", authMiddleware.RequireAPIKey(), transferMarketHandler.GetList)
	app.Get("/api/global/criteria", assessmentCriteriaHandler.GetActive)
	app.Get("/api/global/currencies", currencyHandler.GetExchangeRate)
	app.Post("/api/players/:id/vote", authMiddleware.RequireAPIKey(), playerVoteHandler.HandleVote)
	app.Get("/api/payment-methods", paymentMethodHandler.GetActive)

	app.Post("/api/register", authHandler.Register)
	app.Post("/api/login", authHandler.Login)
	app.Post("/api/logout", authMiddleware.Authenticate, authHandler.Logout)
	app.Post("/api/refresh-token", authHandler.RefreshToken)
	app.Get("/api/profile", authMiddleware.Authenticate, authHandler.GetProfile)
	app.Put("/api/profile", authMiddleware.Authenticate, authHandler.UpdateProfile)
	app.Put("/api/profile/password", authMiddleware.Authenticate, authHandler.UpdatePassword)
	app.Post("/api/profile/upload-photo", authMiddleware.Authenticate, authHandler.UploadProfilePhoto)
	app.Get("/api/games", gameHandler.GetList)
	app.Get("/api/transfer-market", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireVerifiedClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), authMiddleware.RequirePermission("view_transfer_market"), transferMarketHandler.GetList)
	app.Put("/api/transfer-market/:id/status", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireVerifiedClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), transferMarketHandler.UpdateStatus)
	app.Get("/api/access-logs", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "team_owner"), accessLogHandler.GetList)

	// User Profile Enrichment Endpoints
	app.Post("/api/profile/stats", authMiddleware.Authenticate, userProfileHandler.CreateStat)
	app.Put("/api/profile/stats/:id", authMiddleware.Authenticate, userProfileHandler.UpdateStat)
	app.Delete("/api/profile/stats/:id", authMiddleware.Authenticate, userProfileHandler.DeleteStat)

	app.Post("/api/profile/social-media", authMiddleware.Authenticate, userProfileHandler.CreateSocialMedia)
	app.Put("/api/profile/social-media/:id", authMiddleware.Authenticate, userProfileHandler.UpdateSocialMedia)
	app.Delete("/api/profile/social-media/:id", authMiddleware.Authenticate, userProfileHandler.DeleteSocialMedia)

	app.Post("/api/profile/achievements", authMiddleware.Authenticate, userProfileHandler.CreateAchievement)
	app.Put("/api/profile/achievements/:id", authMiddleware.Authenticate, userProfileHandler.UpdateAchievement)
	app.Delete("/api/profile/achievements/:id", authMiddleware.Authenticate, userProfileHandler.DeleteAchievement)

	app.Post("/api/profile/highlights", authMiddleware.Authenticate, userProfileHandler.CreateHighlight)
	app.Put("/api/profile/highlights/:id", authMiddleware.Authenticate, userProfileHandler.UpdateHighlight)
	app.Delete("/api/profile/highlights/:id", authMiddleware.Authenticate, userProfileHandler.DeleteHighlight)

	// Club Endpoints
	app.Post("/api/clubs", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), clubHandler.Create)
	app.Get("/api/clubs/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), clubHandler.GetByID)
	app.Put("/api/clubs/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), clubHandler.Update)
	app.Post("/api/clubs/:id/upload-logo", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "admin"), clubHandler.UploadLogo)
	app.Post("/api/clubs/:id/achievements", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), clubHandler.AddAchievement)
	app.Put("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), clubHandler.UpdateAchievement)
	app.Delete("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), clubHandler.DeleteAchievement)

	// Onboarding Endpoints
	app.Post("/api/clubs/:id/onboarding", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), clubHandler.SubmitOnboarding)
	app.Get("/api/clubs/:id/onboarding", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), clubHandler.GetLatestOnboarding)
	app.Post("/api/admin/onboardings/:id/approve", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), clubHandler.ApproveOnboarding) // ideally admin category, using owner for now
	app.Post("/api/admin/onboardings/:id/reject", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), clubHandler.RejectOnboarding)

	// Team Endpoints
	app.Post("/api/teams", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Create)
	app.Get("/api/teams", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.GetList)
	app.Get("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.GetDetail)
	app.Put("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Update)
	app.Delete("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Delete)
	app.Post("/api/teams/:id/assign", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.AssignMember)
	app.Post("/api/teams/:id/release", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.ReleaseMember)
	app.Post("/api/teams/:id/upload-logo", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.UploadLogo)

	// Trial Management Endpoints
	// Module 1: Trial
	app.Post("/api/trials", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialHandler.Create)
	app.Get("/api/trials", authMiddleware.Authenticate, trialHandler.GetList)
	app.Get("/api/trials/:id", authMiddleware.Authenticate, trialHandler.GetDetail)
	app.Put("/api/trials/:id", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialHandler.Update)

	// Module 1: Trial Application
	app.Get("/api/my-applications", authMiddleware.Authenticate, authMiddleware.RequireCategory("player"), trialAppHandler.GetMyApplications)
	app.Post("/api/trials/:trial_id/apply", authMiddleware.Authenticate, authMiddleware.RequireCategory("player"), trialAppHandler.Apply)
	app.Get("/api/trials/:trial_id/applications", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff", "coach"), authMiddleware.RequireActiveB2BClub(), trialAppHandler.GetByTrial)
	app.Patch("/api/trial-applications/:id/shortlist", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialAppHandler.Shortlist)
	app.Patch("/api/trial-applications/:id/reject", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialAppHandler.Reject)

	// Module 2: Trial Participant
	app.Get("/api/trials/:trial_id/participants", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff", "coach"), authMiddleware.RequireActiveB2BClub(), trialParticipantHandler.GetByTrial)
	app.Patch("/api/trial-participants/:id/attendance", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialParticipantHandler.UpdateAttendance)
	app.Patch("/api/trial-participants/:id/stage", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff"), authMiddleware.RequireActiveB2BClub(), trialParticipantHandler.UpdateStage)

	// Module 3: Assessment Result
	app.Post("/api/assessments", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "coach", "staff"), authMiddleware.RequireActiveB2BClub(), assessmentResultHandler.Create)
	app.Get("/api/participants/:participant_id/assessments", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff", "coach"), authMiddleware.RequireActiveB2BClub(), assessmentResultHandler.GetByParticipant)

	// Module 5: Assessment Scores
	app.Post("/api/assessments/:assessment_id/scores", authMiddleware.Authenticate, authMiddleware.RequireCategory("coach", "staff"), authMiddleware.RequireActiveB2BClub(), assessmentScoreHandler.AddScores)
	app.Get("/api/assessments/:assessment_id/scores", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager", "staff", "coach"), authMiddleware.RequireActiveB2BClub(), assessmentScoreHandler.GetScores)

	// Module 6: Recruitment Decision
	app.Post("/api/recruitment-decisions", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), authMiddleware.RequireActiveB2BClub(), recruitmentDecisionHandler.Create)
	app.Get("/api/trials/:trial_id/recruitment-decisions", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), authMiddleware.RequireActiveB2BClub(), recruitmentDecisionHandler.GetByTrial)

	// User Category List Endpoints (B2B - blocked when club is expired)
	app.Get("/api/players", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), userHandler.GetListByCategory("player"))
	app.Get("/api/players/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), userHandler.GetUserDetail)
	app.Get("/api/coaches", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), userHandler.GetListByCategory("coach"))
	app.Get("/api/owners", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), userHandler.GetListByCategory("owner"))
	app.Get("/api/staff", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), userHandler.GetListByCategory("staff"))
	app.Get("/api/ba", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), userHandler.GetListByCategory("ba"))

	// Talent Endpoints (B2B - blocked when club is expired)
	app.Get("/api/talents", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.GetTalents)
	app.Get("/api/talents/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), userHandler.GetUserDetail)
	app.Post("/api/talents", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), authMiddleware.RequirePermission("manage_talents"), talentHandler.RegisterTalent)
	app.Put("/api/talents/:id/market-value", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.UpdateMarketValue)
	app.Put("/api/talents/:id/biodata", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.UpdateBiodata)
	app.Put("/api/talents/:id/contract-salary", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.UpdateContractAndSalary)
	app.Put("/api/talents/:id/status", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.UpdateStatus)
	app.Post("/api/talents/:id/photo", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.UploadPhoto)
	app.Post("/api/talents/:id/sign", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager", "team_owner"), talentHandler.SignFreeAgent)

	// Subscription Endpoints (B2B)
	// Plans, create, pay & callback intentionally left accessible for expired clubs so they can renew.
	app.Get("/api/subscriptions/plans", subHandler.GetPlans)
	app.Post("/api/subscriptions", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "team_owner"), subHandler.CreateSubscription)
	app.Post("/api/subscriptions/:id/pay", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "team_owner"), subHandler.ChargePayment)
	// Combined Midtrans Callback Handler
	combinedCallbackHandler := func(c *fiber.Ctx) error {
		var payload struct {
			OrderID string `json:"order_id"`
		}
		// Try to parse order_id from body
		if err := json.Unmarshal(c.Body(), &payload); err != nil {
			return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "invalid payload"})
		}

		if strings.HasPrefix(payload.OrderID, "B2C-") {
			return b2cSubHandler.HandleMidtransCallback(c)
		}
		return subHandler.HandleMidtransCallback(c)
	}

	app.Post("/api/subscriptions/callback", combinedCallbackHandler)
	app.Post("/api/callback", combinedCallbackHandler) // Alias for Midtrans notification URL
	app.Get("/api/subscriptions/my-club", authMiddleware.Authenticate, subHandler.GetMySubscriptions)

	// B2C Player & Follow Endpoints
	app.Get("/api/b2c/players/:id", authMiddleware.Authenticate, b2cPlayerHandler.GetB2CPlayerDetail)
	app.Post("/api/b2c/users/:id/follow", authMiddleware.Authenticate, userFollowHandler.Follow)
	app.Delete("/api/b2c/users/:id/unfollow", authMiddleware.Authenticate, userFollowHandler.Unfollow)
	app.Get("/api/b2c/users/:id/follow-status", authMiddleware.Authenticate, userFollowHandler.FollowStatus)
	app.Post("/api/b2c/feedback", authMiddleware.Authenticate, feedbackHandler.Create)
	app.Get("/api/b2c/invitations", authMiddleware.Authenticate, b2cInvitationHandler.GetMyInvitations)
	app.Post("/api/b2c/invitations/:id/respond", authMiddleware.Authenticate, b2cInvitationHandler.Respond)

	// B2C Subscription Endpoints
	b2cSubGroup := app.Group("/api/b2c/subscription", authMiddleware.Authenticate)
	b2cSubGroup.Get("/plans", b2cSubHandler.GetPlans)
	b2cSubGroup.Post("/", b2cSubHandler.CreateSubscription)
	b2cSubGroup.Post("/:id/pay", b2cSubHandler.ChargePayment)
	b2cSubGroup.Get("/me", b2cSubHandler.GetMySubscription)
	b2cSubGroup.Get("/history", b2cSubHandler.GetMyHistory)

	app.Post("/api/b2c/subscription/callback", b2cSubHandler.HandleMidtransCallback)
	app.Get("/api/b2c/subscription/plans", b2cSubHandler.GetPlans) // Public access if needed

	// B2C Post Endpoints
	b2cPostGroup := app.Group("/api/b2c/posts", authMiddleware.Authenticate)
	b2cPostGroup.Post("/", postHandler.CreatePost)
	b2cPostGroup.Get("/", postHandler.GetFeed)
	b2cPostGroup.Post("/:id/like", postHandler.ToggleLike)
	b2cPostGroup.Post("/:id/comments", postHandler.AddComment)
	b2cPostGroup.Get("/:id/comments", postHandler.GetComments)
	b2cPostGroup.Post("/upload-image", postHandler.UploadImage)

	// Public Endpoints
	app.Get("/api/public/players/:username", b2cPlayerHandler.GetPublicPlayerProfile)

	// RBAC Test Endpoints
	app.Get("/api/test/player", authMiddleware.Authenticate, authMiddleware.RequirePermission("edit_portfolio"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Player! You have 'edit_portfolio' permission.", nil)
	})
	app.Get("/api/test/coach", authMiddleware.Authenticate, authMiddleware.RequirePermission("manage_teams"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Coach! You have 'manage_teams' permission.", nil)
	})
	app.Get("/api/test/manager", authMiddleware.Authenticate, authMiddleware.RequirePermission("manage_club"), func(c *fiber.Ctx) error {
		return domainhttp.SendSuccess(c, fiber.StatusOK, "Welcome Manager! You have 'manage_club' permission.", nil)
	})
	// 7. Start Server in a goroutine
	serverAddr := ":" + cfg.ServerPort
	go func() {
		log.Info().Msgf("Server listening on %s", serverAddr)
		if err := app.Listen(serverAddr); err != nil {
			log.Error().Msgf("server stopped with error: %v", err)
		}
	}()

	// 8. Graceful Shutdown Setup
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)

	// Block until a signal is received
	<-quit
	log.Info().Msg("Shutting down server...")

	// Create a context with timeout for graceful shutdown duration
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()

	// Shutdown the Fiber application
	if err := app.ShutdownWithContext(shutdownCtx); err != nil {
		log.Fatal().Msgf("Server forced to shutdown: %v", err)
	}

	log.Info().Msg("Server gracefully stopped.")
}

func migrateAndSeedDB(db *gorm.DB) error {
	// GORM Automigration
	err := db.AutoMigrate(
		&postgres.ClubModel{},
		&postgres.ClubAchievementModel{},
		&postgres.TeamModel{},
		&postgres.UserModel{},
		&postgres.GameModel{},
		&postgres.RolePermissionModel{},
		&postgres.TransferMarketModel{},
		&postgres.SubscriptionPlanModel{},
		&postgres.SubscriptionModel{},
		&postgres.TrialModel{},
		&postgres.TrialApplicationModel{},
		&postgres.TrialParticipantModel{},
		&postgres.AssessmentCriteriaModel{},
		&postgres.AssessmentResultModel{},
		&postgres.AssessmentScoreModel{},
		&postgres.RecruitmentDecisionModel{},
		&postgres.UserStatModel{},
		&postgres.UserSocialMediaModel{},
		&postgres.UserAchievementModel{},
		&postgres.UserHighlightModel{},
		&postgres.AccessLogModel{},
		&domain.ClubOnboarding{},
		&postgres.PlayerVoteModel{},
		&postgres.CurrencyModel{},
		&postgres.UserFollowModel{},
		&postgres.FeedbackModel{},
		&postgres.TeamInvitationModel{},
		&postgres.B2CSubscriptionPlanModel{},
		&postgres.B2CSubscriptionModel{},
		&postgres.PostModel{},
		&postgres.PostLikeModel{},
		&postgres.PostCommentModel{},
		&postgres.PaymentMethodModel{},
	)
	if err != nil {
		return err
	}

	// Seed Assessment Criteria
	if err := seedAssessmentCriteria(db); err != nil {
		return err
	}

	// Seed Payment Methods
	if err := seedPaymentMethods(db); err != nil {
		return err
	}

	// Automatic Seeding of "Free Agent" club (required by .clinerules)
	var count int64
	err = db.Model(&postgres.ClubModel{}).Where("name = ?", "Free Agent").Count(&count).Error
	if err != nil {
		return err
	}

	if count == 0 {
		freeAgentClub := postgres.ClubModel{
			Name:     "Free Agent",
			Status:   "full",
			Category: "club",
		}
		err = db.Create(&freeAgentClub).Error
		if err != nil {
			return err
		}
		log.Info().Msg("Default 'Free Agent' club created successfully.")
	}

	// Automatic Seeding of games
	games := []string{
		"Mobile Legend",
		"Honor Of Kings",
		"PUBG Mobile",
		"Free Fire",
		"Delta Force",
		"eFootball",
		"FC Mobile",
		"Pokemon United",
	}

	for _, gName := range games {
		var gCount int64
		err = db.Model(&postgres.GameModel{}).Where("name = ?", gName).Count(&gCount).Error
		if err != nil {
			return err
		}
		if gCount == 0 {
			game := postgres.GameModel{Name: gName}
			err = db.Create(&game).Error
			if err != nil {
				return err
			}
			log.Info().Msgf("Game '%s' seeded successfully.", gName)
		}
	}

	// Seeding of RBAC Role-Permissions
	rolePermissions := []struct {
		Category   string
		Permission string
	}{
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
		{"team_owner", "view_transfer_market"},
		{"team_owner", "manage_teams"},
		{"team_owner", "manage_talents"},
	}

	for _, rp := range rolePermissions {
		var rpCount int64
		err = db.Model(&postgres.RolePermissionModel{}).
			Where("category = ? AND permission = ?", rp.Category, rp.Permission).
			Count(&rpCount).Error
		if err != nil {
			return err
		}
		if rpCount == 0 {
			perm := postgres.RolePermissionModel{
				Category:   rp.Category,
				Permission: rp.Permission,
			}
			err = db.Create(&perm).Error
			if err != nil {
				return err
			}
			log.Info().Msgf("Role permission '%s -> %s' seeded successfully.", rp.Category, rp.Permission)
		}
	}

	// Seeding of Subscription Plans
	subPlans := []struct {
		Name           string
		DurationMonths int
		Price          int64
		Discount       int64
		Description    string
	}{
		{"Monthly", 1, 199000, 100000, "Akses penuh platform NJARA B2B selama 1 bulan."},
		{"Quarterly", 3, 399000, 198000, "Akses penuh platform NJARA B2B selama 3 bulan. Hemat Rp198.000!"},
		{"Yearly", 12, 1499000, 889000, "Akses penuh platform NJARA B2B selama 12 bulan. Hemat Rp889.000!"},
	}

	for _, sp := range subPlans {
		var spCount int64
		err = db.Model(&postgres.SubscriptionPlanModel{}).Where("name = ?", sp.Name).Count(&spCount).Error
		if err != nil {
			return err
		}
		if spCount == 0 {
			plan := postgres.SubscriptionPlanModel{
				Name:           sp.Name,
				DurationMonths: sp.DurationMonths,
				Price:          sp.Price,
				Discount:       sp.Discount,
				Description:    sp.Description,
				IsActive:       true,
			}
			err = db.Create(&plan).Error
			if err != nil {
				return err
			}
			log.Info().Msgf("Subscription plan '%s' seeded successfully.", sp.Name)
		}
	}

	// Seeding of B2C Subscription Plans
	b2cSubPlans := []struct {
		Name           string
		DurationMonths int
		Price          int64
		Description    string
	}{
		{"Monthly", 1, 15000, "Akses premium B2C: Apply trial tanpa batas, highlight tanpa batas, dan achievement tanpa batas selama 1 bulan."},
		{"Quarterly", 3, 40000, "Akses premium B2C selama 3 bulan. Hemat Rp5.000!"},
	}

	for _, sp := range b2cSubPlans {
		var spCount int64
		err = db.Model(&postgres.B2CSubscriptionPlanModel{}).Where("name = ?", sp.Name).Count(&spCount).Error
		if err != nil {
			return err
		}
		if spCount == 0 {
			plan := postgres.B2CSubscriptionPlanModel{
				Name:           sp.Name,
				DurationMonths: sp.DurationMonths,
				Price:          sp.Price,
				Description:    sp.Description,
				IsActive:       true,
			}
			err = db.Create(&plan).Error
			if err != nil {
				return err
			}
			log.Info().Msgf("B2C Subscription plan '%s' seeded successfully.", sp.Name)
		}
	}

	return nil
}

func seedAssessmentCriteria(db *gorm.DB) error {
	criteria := []postgres.AssessmentCriteriaModel{
		{Name: "Mechanical Skill", Weight: 0.3000, Description: "Aim, reflex, and raw mechanical ability", IsActive: true},
		{Name: "Macro & Game Sense", Weight: 0.2500, Description: "Map awareness, rotation, and decision making", IsActive: true},
		{Name: "Communication", Weight: 0.2000, Description: "Shotcalling, info sharing, and team coordination", IsActive: true},
		{Name: "Adaptability", Weight: 0.1500, Description: "Ability to adapt to draft, meta, and in-game situations", IsActive: true},
		{Name: "Attitude & Professionalism", Weight: 0.1000, Description: "Coachability, mentality, and behavior", IsActive: true},
	}

	for _, c := range criteria {
		var count int64
		if err := db.Model(&postgres.AssessmentCriteriaModel{}).Where("name = ?", c.Name).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := db.Create(&c).Error; err != nil {
				return err
			}
		}
	}
	return nil
}

func seedPaymentMethods(db *gorm.DB) error {
	methods := []postgres.PaymentMethodModel{
		{Name: "BCA Virtual Account", Code: "bca_va", Bank: "bca", Type: "bank_transfer", IsActive: true},
		{Name: "Mandiri Virtual Account", Code: "mandiri_va", Bank: "mandiri", Type: "bank_transfer", IsActive: true},
		{Name: "BNI Virtual Account", Code: "bni_va", Bank: "bni", Type: "bank_transfer", IsActive: true},
		{Name: "BRI Virtual Account", Code: "bri_va", Bank: "bri", Type: "bank_transfer", IsActive: true},
		{Name: "Permata Virtual Account", Code: "permata_va", Bank: "permata", Type: "bank_transfer", IsActive: true},
		{Name: "GoPay", Code: "gopay", Bank: "", Type: "gopay", IsActive: true},
		{Name: "QRIS", Code: "qris", Bank: "", Type: "qris", IsActive: true},
		{Name: "ShopeePay", Code: "shopeepay", Bank: "", Type: "shopeepay", IsActive: true},
	}

	for _, m := range methods {
		var count int64
		if err := db.Model(&postgres.PaymentMethodModel{}).Where("code = ?", m.Code).Count(&count).Error; err != nil {
			return err
		}
		if count == 0 {
			if err := db.Create(&m).Error; err != nil {
				return err
			}
			log.Info().Msgf("Payment method '%s' seeded successfully.", m.Name)
		}
	}
	return nil
}
