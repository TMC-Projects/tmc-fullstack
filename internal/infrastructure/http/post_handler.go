package http

import (
	"fmt"
	"path/filepath"
	"strconv"
	"strings"

	"njara-platform/internal/domain"

	"github.com/gofiber/fiber/v2"
	"github.com/google/uuid"
)

type PostHandler struct {
	postUsecase domain.PostUsecase
	storage     domain.StorageService
}

func NewPostHandler(postUsecase domain.PostUsecase, storage domain.StorageService) *PostHandler {
	return &PostHandler{
		postUsecase: postUsecase,
		storage:     storage,
	}
}

func (h *PostHandler) CreatePost(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)

	var input domain.CreatePostInput
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	if strings.TrimSpace(input.Content) == "" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Content cannot be empty", nil)
	}

	post, err := h.postUsecase.CreatePost(c.Context(), userID, input)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to create post", err)
	}

	return SendSuccess(c, fiber.StatusCreated, "Post created successfully", post)
}

func (h *PostHandler) DeletePost(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	postID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid post ID format", err)
	}

	err = h.postUsecase.DeletePost(c.Context(), userID, postID)
	if err != nil {
		return err // Errors from usecase are already domain.AppError
	}

	return SendSuccess(c, fiber.StatusOK, "Post deleted successfully", nil)
}

func (h *PostHandler) GetFeed(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	posts, err := h.postUsecase.GetFeed(c.Context(), userID, limit, offset)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to fetch feed", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Feed fetched successfully", posts)
}

func (h *PostHandler) ToggleLike(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	postID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid post ID", err)
	}

	isLiked, err := h.postUsecase.ToggleLike(c.Context(), userID, postID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to toggle like", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Like toggled successfully", fiber.Map{"is_liked": isLiked})
}

func (h *PostHandler) AddComment(c *fiber.Ctx) error {
	userID := c.Locals("userID").(int64)
	postID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid post ID", err)
	}

	var input domain.AddCommentInput
	if err := c.BodyParser(&input); err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid request body", err)
	}

	if strings.TrimSpace(input.Content) == "" {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Comment cannot be empty", nil)
	}

	comment, err := h.postUsecase.AddComment(c.Context(), userID, postID, input)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to add comment", err)
	}

	return SendSuccess(c, fiber.StatusCreated, "Comment added successfully", comment)
}

func (h *PostHandler) GetComments(c *fiber.Ctx) error {
	postID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid post ID", err)
	}
	limit, _ := strconv.Atoi(c.Query("limit", "10"))
	offset, _ := strconv.Atoi(c.Query("offset", "0"))

	comments, err := h.postUsecase.GetComments(c.Context(), postID, limit, offset)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to fetch comments", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Comments fetched successfully", comments)
}

func (h *PostHandler) GetPostInteractors(c *fiber.Ctx) error {
	postID, err := strconv.ParseInt(c.Params("id"), 10, 64)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid post ID format", err)
	}

	interactors, err := h.postUsecase.GetPostInteractors(c.Context(), postID)
	if err != nil {
		return domain.NewAppError(domain.ErrCodeInternal, "Failed to fetch interactors", err)
	}

	return SendSuccess(c, fiber.StatusOK, "Interactors fetched successfully", interactors)
}

func (h *PostHandler) UploadImage(c *fiber.Ctx) error {
	file, err := c.FormFile("image")
	if err != nil {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Image file is required", err)
	}

	allowedTypes := map[string]bool{
		"image/jpeg": true,
		"image/png":  true,
		"image/webp": true,
	}
	if !allowedTypes[file.Header.Get("Content-Type")] {
		return domain.NewAppError(domain.ErrCodeBadRequest, "Invalid image format", nil)
	}

	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("post_%s%s", uuid.New().String(), ext)
	
	var url string
	if h.storage != nil {
		// Use MinIO
		src, err := file.Open()
		if err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "Failed to process image", err)
		}
		defer src.Close()

		url, err = h.storage.UploadFile(c.Context(), src, file.Size, file.Header.Get("Content-Type"), "posts/"+fileName)
		if err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "Failed to upload to storage", err)
		}
	} else {
		// Use Local storage
		savePath := fmt.Sprintf("./uploads/posts/%s", fileName)
		if err := c.SaveFile(file, savePath); err != nil {
			return domain.NewAppError(domain.ErrCodeInternal, "Failed to save image locally", err)
		}
		url = fmt.Sprintf("/uploads/posts/%s", fileName)
	}

	return SendSuccess(c, fiber.StatusOK, "Image uploaded successfully", fiber.Map{
		"url": url,
	})
}
