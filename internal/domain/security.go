package domain

// PasswordHasher defines the outbound port for password hashing.
type PasswordHasher interface {
	Hash(password string) (string, error)
	Compare(hashedPassword, password string) error
}

// TokenProvider defines the outbound port for generating and validating auth tokens (JWT).
type TokenProvider interface {
	GenerateToken(userID int64) (string, error)
	ValidateToken(token string) (int64, error)
	GenerateRefreshToken(userID int64) (string, error)
	ValidateRefreshToken(token string) (int64, error)
}
