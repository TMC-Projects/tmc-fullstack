package http

import (
	"fmt"
	"strconv"

	"github.com/gofiber/fiber/v2"
	"njara-platform/internal/domain"
)

// UserProfileHandler handles requests for profile enrichment entities.
type UserProfileHandler struct {
	usecase domain.UserProfileUsecase
}

func NewUserProfileHandler(u domain.UserProfileUsecase) *UserProfileHandler {
	return &UserProfileHandler{usecase: u}
}

// Helper to extract the logged-in user ID
func getUserID(c *fiber.Ctx) (int64, error) {
	val := c.Locals("userID")
	if val == nil {
		return 0, domain.NewAppError(domain.ErrCodeUnauthorized, "unauthorized", nil)
	}
	id, ok := val.(int64)
	if !ok {
		return 0, domain.NewAppError(domain.ErrCodeUnauthorized, "invalid user id type", nil)
	}
	return id, nil
}

func parseIDParam(c *fiber.Ctx) (int64, error) {
	idStr := c.Params("id")
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		return 0, domain.NewAppError(domain.ErrCodeBadRequest, "invalid id parameter", err)
	}
	return id, nil
}

// ─── Stats ───────────────────────────────────────────────────────────────────

type statRequest struct {
	GameID    int64  `json:"game_id"`
	StatName  string `json:"stat_name"`
	StatValue string `json:"stat_value"`
}

func (h *UserProfileHandler) CreateStat(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	var req statRequest
	
	rawBody := c.Body()
	fmt.Printf("Raw Body: %s\n", string(rawBody))

	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	fmt.Printf("Parsed Req: %+v\n", req)

	input := domain.UserStat{
		GameID:    req.GameID,
		StatName:  req.StatName,
		StatValue: req.StatValue,
	}

	res, err := h.usecase.CreateStat(c.UserContext(), userID, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusCreated, "Stat created", res)
}

func (h *UserProfileHandler) UpdateStat(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}
	var req statRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserStat{
		GameID:    req.GameID,
		StatName:  req.StatName,
		StatValue: req.StatValue,
	}

	res, err := h.usecase.UpdateStat(c.UserContext(), userID, id, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Stat updated", res)
}

func (h *UserProfileHandler) DeleteStat(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteStat(c.UserContext(), userID, id); err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Stat deleted", nil)
}

// ─── Social Media ────────────────────────────────────────────────────────────

type socialMediaRequest struct {
	Platform string `json:"platform"`
	Username string `json:"username"`
	URL      string `json:"url"`
}

func (h *UserProfileHandler) CreateSocialMedia(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	var req socialMediaRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserSocialMedia{
		Platform: req.Platform,
		Username: req.Username,
		URL:      req.URL,
	}

	res, err := h.usecase.CreateSocialMedia(c.UserContext(), userID, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusCreated, "Social media created", res)
}

func (h *UserProfileHandler) UpdateSocialMedia(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}
	var req socialMediaRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserSocialMedia{
		Platform: req.Platform,
		Username: req.Username,
		URL:      req.URL,
	}

	res, err := h.usecase.UpdateSocialMedia(c.UserContext(), userID, id, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Social media updated", res)
}

func (h *UserProfileHandler) DeleteSocialMedia(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteSocialMedia(c.UserContext(), userID, id); err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Social media deleted", nil)
}

// ─── Achievements ────────────────────────────────────────────────────────────

type achievementRequest struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Year        int    `json:"year"`
	ImageURL    string `json:"image_url"`
}

func (h *UserProfileHandler) CreateAchievement(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	var req achievementRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserAchievement{
		Title:       req.Title,
		Description: req.Description,
		Year:        req.Year,
		ImageURL:    req.ImageURL,
	}

	res, err := h.usecase.CreateAchievement(c.UserContext(), userID, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusCreated, "Achievement created", res)
}

func (h *UserProfileHandler) UpdateAchievement(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}
	var req achievementRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserAchievement{
		Title:       req.Title,
		Description: req.Description,
		Year:        req.Year,
		ImageURL:    req.ImageURL,
	}

	res, err := h.usecase.UpdateAchievement(c.UserContext(), userID, id, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Achievement updated", res)
}

func (h *UserProfileHandler) DeleteAchievement(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteAchievement(c.UserContext(), userID, id); err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Achievement deleted", nil)
}

// ─── Highlights ──────────────────────────────────────────────────────────────

type highlightRequest struct {
	Title    string `json:"title"`
	VideoURL string `json:"video_url"`
}

func (h *UserProfileHandler) CreateHighlight(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	var req highlightRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserHighlight{
		Title:    req.Title,
		VideoURL: req.VideoURL,
	}

	res, err := h.usecase.CreateHighlight(c.UserContext(), userID, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusCreated, "Highlight created", res)
}

func (h *UserProfileHandler) UpdateHighlight(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}
	var req highlightRequest
	if err := c.BodyParser(&req); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "invalid request body", err)
	}

	input := domain.UserHighlight{
		Title:    req.Title,
		VideoURL: req.VideoURL,
	}

	res, err := h.usecase.UpdateHighlight(c.UserContext(), userID, id, input)
	if err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Highlight updated", res)
}

func (h *UserProfileHandler) DeleteHighlight(c *fiber.Ctx) error {
	userID, err := getUserID(c)
	if err != nil {
		return err
	}
	id, err := parseIDParam(c)
	if err != nil {
		return err
	}

	if err := h.usecase.DeleteHighlight(c.UserContext(), userID, id); err != nil {
		return err
	}
	return SendSuccess(c, fiber.StatusOK, "Highlight deleted", nil)
}
