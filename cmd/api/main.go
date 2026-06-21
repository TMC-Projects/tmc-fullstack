package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"njara-platform/internal/config"
	redisCache "njara-platform/internal/infrastructure/cache"
	domainhttp "njara-platform/internal/infrastructure/http"
	midtransInfra "njara-platform/internal/infrastructure/midtrans"
	"njara-platform/internal/infrastructure/postgres"
	"njara-platform/internal/infrastructure/security"
	"njara-platform/internal/usecase"
	"njara-platform/internal/worker"

	"github.com/gofiber/contrib/fiberzerolog"
	"github.com/gofiber/fiber/v2"
	"github.com/gofiber/fiber/v2/middleware/cors"
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

	authUsecase := usecase.NewAuthUsecase(userRepo, clubRepo, cacheRepo, passwordHasher, tokenProvider, 15*time.Minute, transferMarketRepo)
	gameUsecase := usecase.NewGameUsecase(gameRepo)
	transferMarketUsecase := usecase.NewTransferMarketUsecase(transferMarketRepo, cacheRepo, userRepo, authUsecase)
	userUsecase := usecase.NewUserUsecase(userRepo)
	clubUsecase := usecase.NewClubUsecase(clubRepo, userRepo, rolePermRepo, cacheRepo)
	teamRepo := postgres.NewTeamRepository(db)
	teamUsecase := usecase.NewTeamUsecase(teamRepo, userRepo)

	// Trial Management Usecases
	trialUsecase := usecase.NewTrialUsecase(trialRepo, userRepo, clubRepo)
	trialAppUsecase := usecase.NewTrialApplicationUsecase(trialAppRepo, trialRepo, trialParticipantRepo, userRepo)
	trialParticipantUsecase := usecase.NewTrialParticipantUsecase(trialParticipantRepo, trialRepo, userRepo)
	assessmentResultUsecase := usecase.NewAssessmentResultUsecase(assessmentResultRepo, trialParticipantRepo, trialRepo, userRepo)
	assessmentScoreUsecase := usecase.NewAssessmentScoreUsecase(assessmentScoreRepo, assessmentResultRepo, assessmentCriteriaRepo, userRepo)
	recruitmentDecisionUsecase := usecase.NewRecruitmentDecisionUsecase(recruitmentDecisionRepo, trialParticipantRepo, trialRepo, userRepo, trialAppRepo)
	userProfileUsecase := usecase.NewUserProfileUsecase(userProfileRepo, cacheRepo)
	playerVoteUsecase := usecase.NewPlayerVoteUsecase(userRepo, cacheRepo)

	// Midtrans
	midtransClient := midtransInfra.NewClient(cfg.MidtransServerKey, cfg.MidtransMerchantID)

	// Subscription
	subPlanRepo := postgres.NewSubscriptionPlanRepository(db)
	subRepo := postgres.NewSubscriptionRepository(db)
	subUsecase := usecase.NewSubscriptionUsecase(subRepo, subPlanRepo, clubRepo, userRepo, midtransClient)
	subHandler := domainhttp.NewSubscriptionHandler(subUsecase)

	authHandler := domainhttp.NewAuthHandler(authUsecase)
	gameHandler := domainhttp.NewGameHandler(gameUsecase)
	transferMarketHandler := domainhttp.NewTransferMarketHandler(transferMarketUsecase)
	userHandler := domainhttp.NewUserHandler(userUsecase, authUsecase)
	clubHandler := domainhttp.NewClubHandler(clubUsecase)
	teamHandler := domainhttp.NewTeamHandler(teamUsecase)
	talentUsecase := usecase.NewTalentUsecase(userRepo, authUsecase, transferMarketRepo, cacheRepo)
	talentHandler := domainhttp.NewTalentHandler(talentUsecase)
	playerVoteHandler := domainhttp.NewPlayerVoteHandler(playerVoteUsecase)

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
	app.Static("/uploads", "./uploads")

	// Global Endpoints (API Key only — no JWT required)
	app.Get("/api/global/clubs", authMiddleware.RequireAPIKey(), clubHandler.GetClubs)
	app.Get("/api/global/clubs/:id", authMiddleware.RequireAPIKey(), clubHandler.GetClubDetail)
	app.Get("/api/global/trials", authMiddleware.RequireAPIKey(), trialHandler.GetList)
	app.Get("/api/global/transfer-market", authMiddleware.RequireAPIKey(), transferMarketHandler.GetList)
	app.Get("/api/global/criteria", assessmentCriteriaHandler.GetActive)
	app.Post("/api/players/:id/vote", authMiddleware.RequireAPIKey(), playerVoteHandler.HandleVote)

	app.Post("/api/register", authHandler.Register)
	app.Post("/api/login", authHandler.Login)
	app.Post("/api/logout", authMiddleware.Authenticate, authHandler.Logout)
	app.Post("/api/refresh-token", authHandler.RefreshToken)
	app.Get("/api/profile", authMiddleware.Authenticate, authHandler.GetProfile)
	app.Put("/api/profile", authMiddleware.Authenticate, authHandler.UpdateProfile)
	app.Post("/api/profile/upload-photo", authMiddleware.Authenticate, authHandler.UploadProfilePhoto)
	app.Get("/api/games", gameHandler.GetList)
	app.Get("/api/transfer-market", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), authMiddleware.RequirePermission("view_transfer_market"), transferMarketHandler.GetList)
	app.Put("/api/transfer-market/:id/status", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), transferMarketHandler.UpdateStatus)
	app.Get("/api/access-logs", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner", "manager"), accessLogHandler.GetList)

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
	app.Post("/api/clubs/:id/achievements", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), clubHandler.AddAchievement)
	app.Put("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), clubHandler.UpdateAchievement)
	app.Delete("/api/clubs/:id/achievements/:ach_id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), clubHandler.DeleteAchievement)

	// Team Endpoints
	app.Post("/api/teams", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Create)
	app.Get("/api/teams", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.GetList)
	app.Get("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.GetDetail)
	app.Put("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Update)
	app.Delete("/api/teams/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.Delete)
	app.Post("/api/teams/:id/assign", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequirePermission("manage_teams"), teamHandler.AssignMember)

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
	app.Get("/api/talents", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.GetTalents)
	app.Get("/api/talents/:id", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), userHandler.GetUserDetail)
	app.Post("/api/talents", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), authMiddleware.RequirePermission("manage_talents"), talentHandler.RegisterTalent)
	app.Put("/api/talents/:id/market-value", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.UpdateMarketValue)
	app.Put("/api/talents/:id/biodata", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.UpdateBiodata)
	app.Put("/api/talents/:id/contract-salary", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.UpdateContractAndSalary)
	app.Put("/api/talents/:id/status", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.UpdateStatus)
	app.Post("/api/talents/:id/photo", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.UploadPhoto)
	app.Post("/api/talents/:id/sign", authMiddleware.Authenticate, authMiddleware.RequireActiveB2BClub(), authMiddleware.RequireCategory("owner", "manager"), talentHandler.SignFreeAgent)


	// Subscription Endpoints (B2B)
	// Plans, create, pay & callback intentionally left accessible for expired clubs so they can renew.
	app.Get("/api/subscriptions/plans", subHandler.GetPlans)
	app.Post("/api/subscriptions", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), subHandler.CreateSubscription)
	app.Post("/api/subscriptions/:id/pay", authMiddleware.Authenticate, authMiddleware.RequireCategory("owner"), subHandler.ChargePayment)
	app.Post("/api/subscriptions/callback", subHandler.HandleMidtransCallback)
	app.Post("/api/callback", subHandler.HandleMidtransCallback) // Alias for Midtrans notification URL
	app.Get("/api/subscriptions/my-club", authMiddleware.Authenticate, subHandler.GetMySubscriptions)

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
		&postgres.PlayerVoteModel{},
	)
	if err != nil {
		return err
	}

	// Seed Assessment Criteria
	if err := seedAssessmentCriteria(db); err != nil {
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
		{"Monthly", 1, 299000, 0, "Akses penuh platform Njara B2B selama 1 bulan."},
		{"Quarterly", 3, 799000, 98000, "Akses penuh platform Njara B2B selama 3 bulan. Hemat Rp98.000!"},
		{"Yearly", 12, 2499000, 489000, "Akses penuh platform Njara B2B selama 12 bulan. Hemat Rp489.000!"},
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
