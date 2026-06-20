package tests

import (
	"encoding/json"
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// GET /api/games
// ---------------------------------------------------------------------------

func TestGetGames_Success(t *testing.T) {
	resp, body, err := doRequest("GET", "/api/games", nil, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("expected JSON response, got parse error: %v. Body: %s", err, body)
	}
	
	data, ok := wrapper["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response")
	}

	games := make([]map[string]interface{}, len(data))
	for i, v := range data {
		games[i] = v.(map[string]interface{})
	}

	if len(games) == 0 {
		t.Error("expected at least one game in the list, got empty array")
	}

	// Verify each game has required fields
	for i, game := range games {
		if _, hasID := game["id"]; !hasID {
			t.Errorf("game[%d] missing 'id' field", i)
		}
		name, hasName := game["name"]
		if !hasName {
			t.Errorf("game[%d] missing 'name' field", i)
		} else if name == "" {
			t.Errorf("game[%d] has empty 'name'", i)
		}
	}
}

func TestGetGames_ContainsSeededGames(t *testing.T) {
	expectedGames := []string{
		"Mobile Legend",
		"Honor Of Kings",
		"PUBG Mobile",
		"Free Fire",
		"Delta Force",
		"eFootball",
		"FC Mobile",
		"Pokemon United",
	}

	resp, body, err := doRequest("GET", "/api/games", nil, "")
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
	data, ok := wrapper["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response")
	}

	games := make([]map[string]interface{}, len(data))
	for i, v := range data {
		games[i] = v.(map[string]interface{})
	}

	// Build a set of returned game names
	returnedNames := make(map[string]bool)
	for _, g := range games {
		if name, ok := g["name"].(string); ok {
			returnedNames[name] = true
		}
	}

	// Verify all seeded games are present
	for _, expected := range expectedGames {
		if !returnedNames[expected] {
			t.Errorf("expected seeded game %q not found in response", expected)
		}
	}
}

func TestGetGames_NoAuthRequired(t *testing.T) {
	// Explicitly confirm no auth needed (no token sent)
	resp, _, err := doRequest("GET", "/api/games", nil, "")
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode == http.StatusUnauthorized {
		t.Error("GET /api/games should NOT require authentication, but got 401")
	}
}
