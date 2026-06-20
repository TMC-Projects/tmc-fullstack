package tests

import (
	"encoding/json"
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// GET /api/test/player  (requires 'edit_portfolio' permission → player category)
// GET /api/test/coach   (requires 'manage_teams' permission  → coach/manager category)
// GET /api/test/manager (requires 'manage_club' permission   → manager category)
// ---------------------------------------------------------------------------

func TestRBAC_Player_CanAccessPlayerEndpoint(t *testing.T) {
	playerToken, _ := registerTestUser(t, "player")

	resp, body, err := doRequest("GET", "/api/test/player", nil, playerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("player expected 200 OK on /api/test/player, got %d. Body: %s", resp.StatusCode, body)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(body, &result); err != nil {
		t.Fatalf("failed to unmarshal response: %v", err)
	}
	if _, hasMsg := result["message"]; !hasMsg {
		t.Errorf("expected 'message' field in successful RBAC response, got: %v", result)
	}
}

func TestRBAC_Coach_CannotAccessPlayerEndpoint(t *testing.T) {
	// Coach has 'manage_teams' but NOT 'edit_portfolio'
	coachToken, _ := registerTestUser(t, "coach")

	resp, body, err := doRequest("GET", "/api/test/player", nil, coachToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("coach expected 403 Forbidden on /api/test/player, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Manager_CannotAccessPlayerEndpoint(t *testing.T) {
	// Manager has 'manage_club', 'manage_teams', 'view_analytics' but NOT 'edit_portfolio'
	managerToken, _ := registerTestUser(t, "manager")

	resp, body, err := doRequest("GET", "/api/test/player", nil, managerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("manager expected 403 Forbidden on /api/test/player, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Coach_CanAccessCoachEndpoint(t *testing.T) {
	coachToken, _ := registerTestUser(t, "coach")

	resp, body, err := doRequest("GET", "/api/test/coach", nil, coachToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("coach expected 200 OK on /api/test/coach, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Manager_CanAccessCoachEndpoint(t *testing.T) {
	// Manager also has 'manage_teams' permission
	managerToken, _ := registerTestUser(t, "manager")

	resp, body, err := doRequest("GET", "/api/test/coach", nil, managerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("manager expected 200 OK on /api/test/coach (has manage_teams), got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Player_CannotAccessCoachEndpoint(t *testing.T) {
	// Player does NOT have 'manage_teams'
	playerToken, _ := registerTestUser(t, "player")

	resp, body, err := doRequest("GET", "/api/test/coach", nil, playerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("player expected 403 Forbidden on /api/test/coach, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Manager_CanAccessManagerEndpoint(t *testing.T) {
	managerToken, _ := registerTestUser(t, "manager")

	resp, body, err := doRequest("GET", "/api/test/manager", nil, managerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("manager expected 200 OK on /api/test/manager, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Player_CannotAccessManagerEndpoint(t *testing.T) {
	playerToken, _ := registerTestUser(t, "player")

	resp, body, err := doRequest("GET", "/api/test/manager", nil, playerToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("player expected 403 Forbidden on /api/test/manager, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_Coach_CannotAccessManagerEndpoint(t *testing.T) {
	// Coach has 'manage_teams' but NOT 'manage_club'
	coachToken, _ := registerTestUser(t, "coach")

	resp, body, err := doRequest("GET", "/api/test/manager", nil, coachToken)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("coach expected 403 Forbidden on /api/test/manager, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestRBAC_NoToken_AllEndpoints(t *testing.T) {
	protectedEndpoints := []string{
		"/api/test/player",
		"/api/test/coach",
		"/api/test/manager",
	}

	for _, path := range protectedEndpoints {
		t.Run(path, func(t *testing.T) {
			resp, body, err := doRequest("GET", path, nil, "")
			if err != nil {
				t.Fatalf("request error: %v", err)
			}
			if resp.StatusCode != http.StatusUnauthorized {
				t.Errorf("expected 401 Unauthorized for unauthenticated request to %s, got %d. Body: %s", path, resp.StatusCode, body)
			}
		})
	}
}

func TestRBAC_InvalidToken_AllEndpoints(t *testing.T) {
	protectedEndpoints := []string{
		"/api/test/player",
		"/api/test/coach",
		"/api/test/manager",
	}

	for _, path := range protectedEndpoints {
		t.Run(path, func(t *testing.T) {
			resp, body, err := doRequest("GET", path, nil, "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature")
			if err != nil {
				t.Fatalf("request error: %v", err)
			}
			if resp.StatusCode != http.StatusUnauthorized {
				t.Errorf("expected 401 Unauthorized for invalid token on %s, got %d. Body: %s", path, resp.StatusCode, body)
			}
		})
	}
}
