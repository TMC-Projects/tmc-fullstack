package domain

import (
	"context"
	"io"
)

// StorageService defines the interface for uploading files to a storage backend.
type StorageService interface {
	// UploadFile uploads a file to the storage backend and returns its public URL.
	UploadFile(ctx context.Context, file io.Reader, size int64, contentType, objectName string) (string, error)
}
