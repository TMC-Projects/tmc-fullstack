package tests

import (
	"encoding/json"
	"net/http"
	"testing"
	"time"
)

func TestCreateClub_Success(t *testing.T) {
	// 1. Register Owner
	token, email := registerTestUser(t, "owner")

	// 2. Create Club payload
	payload := map[string]interface{}{
		"name":             uniqueUsername("ClubAlpha_"),
		"address":          "123 eSports St",
		"country":          "ID",
		"established_year": 2026,
		"category":         "club",
		"status":           "trial",
	}

	resp, body, err := doRequest("POST", "/api/clubs", payload, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. Body: %s", resp.StatusCode, body)
	}

	// 3. Verify user's club was updated
	_, bodyProf, _ := doRequest("GET", "/api/profile", nil, token)
	var profWrapper map[string]interface{}
	json.Unmarshal(bodyProf, &profWrapper)
	profData, _ := profWrapper["data"].(map[string]interface{})
	clubID := int64(profData["club_id"].(float64))

	if clubID == 0 || clubID == 1 {
		t.Errorf("expected user club_id to be updated to new club, got %d", clubID)
	}

	// Cleanup
	t.Cleanup(func() {
		// Clean the club we created or just leave it since DB refreshes might happen.
		// Track test user handles the user deletion.
	})
	_ = email // used for tracking
}

func TestCreateClub_ForbiddenForPlayer(t *testing.T) {
	// Register player
	token, _ := registerTestUser(t, "player")

	payload := map[string]interface{}{
		"name": uniqueUsername("ClubBeta_"),
	}

	resp, body, _ := doRequest("POST", "/api/clubs", payload, token)
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for player creating club, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestB2B_AccessDenied_ExpiredTrial(t *testing.T) {
	// 1. Register Owner
	token, _ := registerTestUser(t, "owner")

	// 2. Create Club with expired trial date
	pastDate := time.Now().Add(-24 * time.Hour)
	payload := map[string]interface{}{
		"name":         uniqueUsername("ExpiredClub_"),
		"status":       "trial",
		"expired_date": pastDate.Format(time.RFC3339),
	}

	respC, bodyC, err := doRequest("POST", "/api/clubs", payload, token)
	if err != nil || respC.StatusCode != http.StatusCreated {
		t.Fatalf("failed to create club: %d %s", respC.StatusCode, bodyC)
	}

	// 3. Try accessing B2B Transfer Market
	resp, body, _ := doRequest("GET", "/api/transfer-market", nil, token)
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for expired trial, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestB2B_AccessDenied_ExpiredStatus(t *testing.T) {
	// 1. Register Owner
	token, _ := registerTestUser(t, "owner")

	// 2. Create Club with status expired
	payload := map[string]interface{}{
		"name":   uniqueUsername("ExpiredStatusClub_"),
		"status": "expired",
	}

	respC, bodyC, err := doRequest("POST", "/api/clubs", payload, token)
	if err != nil || respC.StatusCode != http.StatusCreated {
		t.Fatalf("failed to create club: %d %s", respC.StatusCode, bodyC)
	}

	// 3. Try accessing B2B Transfer Market
	resp, body, _ := doRequest("GET", "/api/transfer-market", nil, token)
	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for expired status, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestB2B_AccessAllowed_ActiveTrial(t *testing.T) {
	// 1. Register Owner
	token, _ := registerTestUser(t, "owner")

	// 2. Create Club with future expired date
	futureDate := time.Now().Add(24 * time.Hour)
	payload := map[string]interface{}{
		"name":         uniqueUsername("ActiveTrialClub_"),
		"status":       "trial",
		"expired_date": futureDate.Format(time.RFC3339),
	}

	respC, bodyC, err := doRequest("POST", "/api/clubs", payload, token)
	if err != nil || respC.StatusCode != http.StatusCreated {
		t.Fatalf("failed to create club: %d %s", respC.StatusCode, bodyC)
	}

	// 3. Try accessing B2B Transfer Market
	resp, body, _ := doRequest("GET", "/api/transfer-market", nil, token)
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for active trial, got %d. Body: %s", resp.StatusCode, body)
	}
}
