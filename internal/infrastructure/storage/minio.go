package storage

import (
	"context"
	"fmt"
	"io"
	"strings"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"njara-platform/internal/config"
	"njara-platform/internal/domain"
	"github.com/rs/zerolog/log"
)

type minioStorageService struct {
	client    *minio.Client
	bucket    string
	publicURL string
}

// NewMinioStorageService initializes the MinIO client and ensures the bucket exists and is public.
func NewMinioStorageService(cfg config.Config) (domain.StorageService, error) {
	// Initialize minio client object.
	minioClient, err := minio.New(cfg.MinioEndpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinioAccessKey, cfg.MinioSecretKey, ""),
		Secure: cfg.MinioUseSSL,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to initialize minio client: %w", err)
	}

	ctx := context.Background()

	// Ensure bucket exists
	exists, err := minioClient.BucketExists(ctx, cfg.MinioBucket)
	if err != nil {
		return nil, fmt.Errorf("failed to check if minio bucket exists: %w", err)
	}

	if !exists {
		err = minioClient.MakeBucket(ctx, cfg.MinioBucket, minio.MakeBucketOptions{})
		if err != nil {
			return nil, fmt.Errorf("failed to create minio bucket: %w", err)
		}
		log.Info().Msgf("Created MinIO bucket: %s", cfg.MinioBucket)
	}

	// Set public read policy on the bucket
	policy := fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": {"AWS": ["*"]},
				"Action": ["s3:GetObject"],
				"Resource": ["arn:aws:s3:::%s/*"]
			}
		]
	}`, cfg.MinioBucket)

	err = minioClient.SetBucketPolicy(ctx, cfg.MinioBucket, policy)
	if err != nil {
		log.Warn().Msgf("Warning: failed to set public bucket policy: %v", err)
	}

	// Remove trailing slash from public URL if present
	publicURL := strings.TrimRight(cfg.MinioPublicURL, "/")

	return &minioStorageService{
		client:    minioClient,
		bucket:    cfg.MinioBucket,
		publicURL: publicURL,
	}, nil
}

func (s *minioStorageService) UploadFile(ctx context.Context, file io.Reader, size int64, contentType, objectName string) (string, error) {
	_, err := s.client.PutObject(ctx, s.bucket, objectName, file, size, minio.PutObjectOptions{
		ContentType: contentType,
	})
	if err != nil {
		return "", fmt.Errorf("failed to upload object to minio: %w", err)
	}

	// Generate the public URL
	fileURL := fmt.Sprintf("%s/%s/%s", s.publicURL, s.bucket, objectName)
	return fileURL, nil
}
