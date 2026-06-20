package tests

import (
	"encoding/json"
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// POST /api/register
// ---------------------------------------------------------------------------

func TestRegister_Success(t *testing.T) {
	email := uniqueEmail("register")
	username := uniqueUsername("register")
	trackTestUser(email)

	payload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  "StrongPass123!",
		"full_name": "Integration Tester",
		"category":  "player",
		"language":  "id",
		"bio":       "Test user bio",
	}

	resp, body, err := doRequest("POST", "/api/register", payload, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected status 201 Created, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal response: %v. Body: %s", err, body)
	}
	result, ok := wrapper["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'data' object in response, got: %v", wrapper["data"])
	}

	// Validate token exists
	token, ok := result["token"].(string)
	if !ok || token == "" {
		t.Errorf("expected non-empty 'token' in response, got: %v", result["token"])
	}

	// Validate user object
	userObj, ok := result["user"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'user' object in response, got: %T", result["user"])
	}
	if userObj["email"] != email {
		t.Errorf("expected email %q, got %q", email, userObj["email"])
	}
	if userObj["username"] != username {
		t.Errorf("expected username %q, got %q", username, userObj["username"])
	}
	if userObj["category"] != "player" {
		t.Errorf("expected category 'player', got %q", userObj["category"])
	}
}

func TestRegister_MissingRequiredFields(t *testing.T) {
	testCases := []struct {
		name    string
		payload map[string]string
	}{
		{
			name: "missing username",
			payload: map[string]string{
				"email":     uniqueEmail("miss_user"),
				"password":  "StrongPass123!",
				"full_name": "Test User",
			},
		},
		{
			name: "missing email",
			payload: map[string]string{
				"username":  uniqueUsername("miss_email"),
				"password":  "StrongPass123!",
				"full_name": "Test User",
			},
		},
		{
			name: "missing password",
			payload: map[string]string{
				"username":  uniqueUsername("miss_pass"),
				"email":     uniqueEmail("miss_pass"),
				"full_name": "Test User",
			},
		},
		{
			name: "missing full_name",
			payload: map[string]string{
				"username": uniqueUsername("miss_fname"),
				"email":    uniqueEmail("miss_fname"),
				"password": "StrongPass123!",
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			resp, body, err := doRequest("POST", "/api/register", tc.payload, "")
			if err != nil {
				t.Fatalf("request error: %v", err)
			}
			if resp.StatusCode != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request, got %d. Body: %s", resp.StatusCode, body)
			}

			var result map[string]interface{}
			if err := json.Unmarshal(body, &result); err != nil {
				t.Fatalf("failed to unmarshal error response: %v", err)
			}
			if _, hasError := result["error"]; !hasError {
				t.Errorf("expected 'error' key in response, got: %v", result)
			}
		})
	}
}

func TestRegister_DuplicateEmail(t *testing.T) {
	email := uniqueEmail("dup_email")
	username1 := uniqueUsername("dup_email_u1")
	username2 := uniqueUsername("dup_email_u2")
	trackTestUser(email)

	// First registration should succeed
	payload1 := map[string]string{
		"username":  username1,
		"email":     email,
		"password":  "StrongPass123!",
		"full_name": "First User",
	}
	resp1, body1, err := doRequest("POST", "/api/register", payload1, "")
	if err != nil {
		t.Fatalf("first registration request error: %v", err)
	}
	if resp1.StatusCode != http.StatusCreated {
		t.Fatalf("first registration expected 201, got %d. Body: %s", resp1.StatusCode, body1)
	}

	// Second registration with same email should fail
	payload2 := map[string]string{
		"username":  username2,
		"email":     email,
		"password":  "AnotherPass456!",
		"full_name": "Second User",
	}
	resp2, body2, err := doRequest("POST", "/api/register", payload2, "")
	if err != nil {
		t.Fatalf("second registration request error: %v", err)
	}
	if resp2.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for duplicate email, got %d. Body: %s", resp2.StatusCode, body2)
	}
}

func TestRegister_DuplicateUsername(t *testing.T) {
	username := uniqueUsername("dup_uname")
	email1 := uniqueEmail("dup_uname_e1")
	email2 := uniqueEmail("dup_uname_e2")
	trackTestUser(email1)
	trackTestUser(email2)

	// First registration
	payload1 := map[string]string{
		"username":  username,
		"email":     email1,
		"password":  "StrongPass123!",
		"full_name": "First User",
	}
	resp1, body1, err := doRequest("POST", "/api/register", payload1, "")
	if err != nil {
		t.Fatalf("first registration request error: %v", err)
	}
	if resp1.StatusCode != http.StatusCreated {
		t.Fatalf("first registration expected 201, got %d. Body: %s", resp1.StatusCode, body1)
	}

	// Second registration with same username
	payload2 := map[string]string{
		"username":  username,
		"email":     email2,
		"password":  "AnotherPass456!",
		"full_name": "Second User",
	}
	resp2, body2, err := doRequest("POST", "/api/register", payload2, "")
	if err != nil {
		t.Fatalf("second registration request error: %v", err)
	}
	if resp2.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for duplicate username, got %d. Body: %s", resp2.StatusCode, body2)
	}
}

func TestRegister_DefaultCategoryIsPlayer(t *testing.T) {
	email := uniqueEmail("default_cat")
	trackTestUser(email)

	payload := map[string]string{
		"username":  uniqueUsername("default_cat"),
		"email":     email,
		"password":  "StrongPass123!",
		"full_name": "Default Category User",
		// category is intentionally omitted
	}

	resp, body, err := doRequest("POST", "/api/register", payload, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	userObj, _ := result["user"].(map[string]interface{})
	if userObj["category"] != "player" {
		t.Errorf("expected default category 'player', got %q", userObj["category"])
	}
}

// ---------------------------------------------------------------------------
// POST /api/login
// ---------------------------------------------------------------------------

func TestLogin_Success(t *testing.T) {
	// Register a user first
	email := uniqueEmail("login_ok")
	username := uniqueUsername("login_ok")
	trackTestUser(email)
	password := "LoginPass123!"

	regPayload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  password,
		"full_name": "Login Test User",
	}
	regResp, regBody, err := doRequest("POST", "/api/register", regPayload, "")
	if err != nil || regResp.StatusCode != http.StatusCreated {
		t.Fatalf("setup registration failed: status=%d body=%s err=%v", regResp.StatusCode, regBody, err)
	}

	// Now login
	loginPayload := map[string]string{
		"email":    email,
		"password": password,
	}
	resp, body, err := doRequest("POST", "/api/login", loginPayload, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	result, ok := wrapper["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'data' object in response")
	}

	token, ok := result["token"].(string)
	if !ok || token == "" {
		t.Errorf("expected non-empty 'token' in response, got: %v", result["token"])
	}

	userObj, ok := result["user"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'user' object in response")
	}
	if userObj["email"] != email {
		t.Errorf("expected email %q in response, got %q", email, userObj["email"])
	}
}

func TestLogin_WrongPassword(t *testing.T) {
	// Register user
	email := uniqueEmail("login_badpass")
	trackTestUser(email)
	regPayload := map[string]string{
		"username":  uniqueUsername("login_badpass"),
		"email":     email,
		"password":  "CorrectPass123!",
		"full_name": "Bad Pass Tester",
	}
	regResp, regBody, err := doRequest("POST", "/api/register", regPayload, "")
	if err != nil || regResp.StatusCode != http.StatusCreated {
		t.Fatalf("setup registration failed: status=%d body=%s err=%v", regResp.StatusCode, regBody, err)
	}

	// Login with wrong password
	loginPayload := map[string]string{
		"email":    email,
		"password": "WrongPassword!",
	}
	resp, body, err := doRequest("POST", "/api/login", loginPayload, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestLogin_UserNotFound(t *testing.T) {
	loginPayload := map[string]string{
		"email":    "nonexistent_user@test.njara.io",
		"password": "SomePassword123!",
	}
	resp, body, err := doRequest("POST", "/api/login", loginPayload, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestLogin_MissingFields(t *testing.T) {
	testCases := []struct {
		name    string
		payload map[string]string
	}{
		{
			name:    "missing email",
			payload: map[string]string{"password": "SomePass123!"},
		},
		{
			name:    "missing password",
			payload: map[string]string{"email": "someone@test.njara.io"},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			resp, body, err := doRequest("POST", "/api/login", tc.payload, "")
			if err != nil {
				t.Fatalf("request error: %v", err)
			}
			if resp.StatusCode != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request, got %d. Body: %s", resp.StatusCode, body)
			}
		})
	}
}

// ---------------------------------------------------------------------------
// GET /api/profile
// ---------------------------------------------------------------------------

func TestGetProfile_Success(t *testing.T) {
	token, email := registerTestUser(t, "player")

	resp, body, err := doRequest("GET", "/api/profile", nil, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	result, ok := wrapper["data"].(map[string]interface{})
	if !ok {
		t.Fatalf("expected 'data' object in response")
	}

	if result["email"] != email {
		t.Errorf("expected email %q, got %q", email, result["email"])
	}
	// Ensure password hash is NOT returned
	if _, hasPasswordHash := result["password_hash"]; hasPasswordHash {
		t.Error("response must NOT contain 'password_hash' field")
	}
}

func TestGetProfile_NoAuthorizationHeader(t *testing.T) {
	resp, body, err := doRequest("GET", "/api/profile", nil, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestGetProfile_InvalidToken(t *testing.T) {
	resp, body, err := doRequest("GET", "/api/profile", nil, "this.is.not.a.valid.jwt")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized for invalid token, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestGetProfile_MalformedAuthHeader(t *testing.T) {
	// Send "Token xxx" instead of "Bearer xxx"
	req := makeRequestWithCustomHeader("GET", "/api/profile", nil, "Token some_token_value")
	resp, body, err := executeRawRequest(req)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized for malformed auth header, got %d. Body: %s", resp.StatusCode, body)
	}
}
