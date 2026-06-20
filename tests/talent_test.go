package tests

import (
	"encoding/json"
	"net/http"
	"testing"
)

func TestRegisterTalent_SuccessOwner(t *testing.T) {
	// 1. Register Owner
	token, _ := registerTestUser(t, "owner")

	// 2. Register Talent
	payload := map[string]interface{}{
		"username":  uniqueUsername("talent_"),
		"email":     uniqueEmail("talent_"),
		"password":  "SuperSecret123!",
		"full_name": "New Talent",
		"category":  "player",
		"salary":    5000,
	}

	resp, body, err := doRequest("POST", "/api/talents", payload, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}

	if resp.StatusCode != http.StatusCreated {
		t.Fatalf("expected 201 Created, got %d. Body: %s", resp.StatusCode, string(body))
	}

	var wrapper map[string]interface{}
	json.Unmarshal(body, &wrapper)
	data, _ := wrapper["data"].(map[string]interface{})

	if data["club_id"] == nil || data["club_id"].(float64) == 0 {
		t.Errorf("expected club_id to be assigned automatically")
	}
	if data["category"] != "player" {
		t.Errorf("expected category 'player', got %v", data["category"])
	}
}

func TestRegisterTalent_ForbiddenPlayer(t *testing.T) {
	// 1. Register Player (does not have manage_talents permission)
	token, _ := registerTestUser(t, "player")

	// 2. Register Talent
	payload := map[string]interface{}{
		"username":  uniqueUsername("talent_fail_"),
		"email":     uniqueEmail("talent_fail_"),
		"password":  "SuperSecret123!",
		"full_name": "New Talent",
		"category":  "coach",
	}

	resp, _, err := doRequest("POST", "/api/talents", payload, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}

	if resp.StatusCode != http.StatusForbidden {
		t.Fatalf("expected 403 Forbidden for player registering talent, got %d", resp.StatusCode)
	}
}
