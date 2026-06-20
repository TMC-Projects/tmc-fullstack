package security

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type bcryptHasher struct{}

// NewPasswordHasher creates a new instance of domain.PasswordHasher adapter.
func NewPasswordHasher() *bcryptHasher {
	return &bcryptHasher{}
}

func (h *bcryptHasher) Hash(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

func (h *bcryptHasher) Compare(hashedPassword, password string) error {
	return bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
}

type jwtProvider struct {
	secretKey     []byte
	tokenDuration time.Duration
}

// NewTokenProvider creates a new instance of domain.TokenProvider adapter.
func NewTokenProvider(secret string, duration time.Duration) *jwtProvider {
	return &jwtProvider{
		secretKey:     []byte(secret),
		tokenDuration: duration,
	}
}

type claims struct {
	UserID    int64  `json:"user_id"`
	TokenType string `json:"token_type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

func (p *jwtProvider) GenerateToken(userID int64) (string, error) {
	tokenClaims := &claims{
		UserID:    userID,
		TokenType: "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(p.tokenDuration)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, tokenClaims)
	return token.SignedString(p.secretKey)
}

func (p *jwtProvider) ValidateToken(tokenString string) (int64, error) {
	token, err := jwt.ParseWithClaims(tokenString, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return p.secretKey, nil
	})
	if err != nil {
		return 0, err
	}

	if c, ok := token.Claims.(*claims); ok && token.Valid {
		if c.TokenType != "access" {
			return 0, errors.New("invalid token type, expected access token")
		}
		return c.UserID, nil
	}

	return 0, errors.New("invalid token")
}

func (p *jwtProvider) GenerateRefreshToken(userID int64) (string, error) {
	tokenClaims := &claims{
		UserID:    userID,
		TokenType: "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(7 * 24 * time.Hour)), // Refresh token valid for 7 days
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, tokenClaims)
	return token.SignedString(p.secretKey)
}

func (p *jwtProvider) ValidateRefreshToken(tokenString string) (int64, error) {
	token, err := jwt.ParseWithClaims(tokenString, &claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return p.secretKey, nil
	})
	if err != nil {
		return 0, err
	}

	if c, ok := token.Claims.(*claims); ok && token.Valid {
		if c.TokenType != "refresh" {
			return 0, errors.New("invalid token type, expected refresh token")
		}
		return c.UserID, nil
	}

	return 0, errors.New("invalid refresh token")
}
