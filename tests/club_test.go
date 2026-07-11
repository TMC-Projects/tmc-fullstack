package tests

import (
	"encoding/json"
	"net/http"
	"testing"
	"strconv"
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

func TestClubAchievement_CRUD(t *testing.T) {
	token, _ := registerTestUser(t, "owner")

	// Create Club
	clubPayload := map[string]interface{}{
		"name":   uniqueUsername("ClubAchieve_"),
		"status": "full",
	}
	_, _, _ = doRequest("POST", "/api/clubs", clubPayload, token)
	var profWrapper map[string]interface{}
	doRequest("GET", "/api/profile", nil, token) // to update user's club_id, wait actually we get it from profile
	_, bodyP, _ := doRequest("GET", "/api/profile", nil, token)
	json.Unmarshal(bodyP, &profWrapper)
	profData, _ := profWrapper["data"].(map[string]interface{})
	clubID := int64(profData["club_id"].(float64))

	// 1. Add Achievement
	achPayload := map[string]interface{}{
		"title":               "1st Place MPL Indonesia Season 12",
		"tournament_name":     "MPL ID S12",
		"game_title":          "MLBB",
		"placement":           "Champion",
		"achievement_date":    "2023-10-15",
		"tournament_tier":     "S-Tier",
		"prize_pool_currency": "IDR",
		"prize_pool_amount":   1200000000,
		"event_scale":         "national",
		"reference_url":       "https://liquipedia.net/...",
		"certificate_url":     "https://example.com/cert.jpg",
	}
	respAdd, bodyAdd, _ := doRequest("POST", "/api/clubs/"+strconv.FormatInt(clubID, 10)+"/achievements", achPayload, token)
	if respAdd.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 Created for add achievement, got %d. Body: %s", respAdd.StatusCode, bodyAdd)
	}

	var addResp map[string]interface{}
	json.Unmarshal(bodyAdd, &addResp)
	achData := addResp["data"].(map[string]interface{})
	achID := int64(achData["id"].(float64))

	if achData["tournament_name"] != "MPL ID S12" {
		t.Errorf("expected tournament_name MPL ID S12, got %v", achData["tournament_name"])
	}

	// 2. Update Achievement
	updatePayload := map[string]interface{}{
		"title":               "1st Place MPL Indonesia Season 12",
		"tournament_name":     "MPL ID S12 (Updated)",
		"game_title":          "MLBB",
		"placement":           "Champion",
		"achievement_date":    "2023-10-15",
	}
	respUp, bodyUp, _ := doRequest("PUT", "/api/clubs/"+strconv.FormatInt(clubID, 10)+"/achievements/"+strconv.FormatInt(achID, 10), updatePayload, token)
	if respUp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for update achievement, got %d. Body: %s", respUp.StatusCode, bodyUp)
	}

	// Verify update via Get Club
	respGet, bodyGet, _ := doRequest("GET", "/api/clubs/"+strconv.FormatInt(clubID, 10), nil, token)
	if respGet.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for get club, got %d. Body: %s", respGet.StatusCode, bodyGet)
	}
	var getResp map[string]interface{}
	json.Unmarshal(bodyGet, &getResp)
	clubData := getResp["data"].(map[string]interface{})
	achievements := clubData["achievements"].([]interface{})
	
	if len(achievements) != 1 {
		t.Fatalf("expected 1 achievement, got %d", len(achievements))
	}
	updatedAch := achievements[0].(map[string]interface{})
	if updatedAch["tournament_name"] != "MPL ID S12 (Updated)" {
		t.Errorf("expected updated tournament_name, got %v", updatedAch["tournament_name"])
	}
}
