package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// GET /api/transfer-market  (B2B endpoint — requires owner or manager role)
// ---------------------------------------------------------------------------

// helperGetTransferMarket fires an authenticated request to /api/transfer-market.
func helperGetTransferMarket(t *testing.T, token, query string) (*http.Response, []byte) {
	t.Helper()
	path := "/api/transfer-market"
	if query != "" {
		path = path + "?" + query
	}
	resp, body, err := doRequest("GET", path, nil, token)
	if err != nil {
		t.Fatalf("transfer market request error: %v", err)
	}
	return resp, body
}

// ---------------------------------------------------------------------------
// Access Control
// ---------------------------------------------------------------------------

func TestTransferMarket_RequiresAuthentication(t *testing.T) {
	// No token → must return 401
	resp, body := helperGetTransferMarket(t, "", "")
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized without token, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_InvalidToken_Returns401(t *testing.T) {
	resp, body := helperGetTransferMarket(t, "this.is.invalid.jwt", "")
	if resp.StatusCode != http.StatusUnauthorized {
		t.Errorf("expected 401 Unauthorized with invalid token, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_OwnerCanAccess(t *testing.T) {
	ownerToken, _ := registerTestUser(t, "owner")

	resp, body := helperGetTransferMarket(t, ownerToken, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for owner, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_ManagerCanAccess(t *testing.T) {
	managerToken, _ := registerTestUser(t, "manager")

	resp, body := helperGetTransferMarket(t, managerToken, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK for manager, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_PlayerCannotAccess(t *testing.T) {
	playerToken, _ := registerTestUser(t, "player")

	resp, body := helperGetTransferMarket(t, playerToken, "")
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden for player, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_CoachCannotAccess(t *testing.T) {
	coachToken, _ := registerTestUser(t, "coach")

	resp, body := helperGetTransferMarket(t, coachToken, "")
	if resp.StatusCode != http.StatusForbidden {
		t.Errorf("expected 403 Forbidden for coach, got %d. Body: %s", resp.StatusCode, body)
	}
}

// ---------------------------------------------------------------------------
// Response Shape & Data
// ---------------------------------------------------------------------------

func TestTransferMarket_ResponseShape(t *testing.T) {
	ownerToken, _ := registerTestUser(t, "owner")

	resp, body := helperGetTransferMarket(t, ownerToken, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("expected JSON object, got parse error: %v. Body: %s", err, body)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	// Validate required top-level keys
	for _, key := range []string{"data", "total", "page", "limit"} {
		if _, ok := result[key]; !ok {
			t.Errorf("expected key %q in response, got: %v", key, result)
		}
	}

	// Validate data is an array
	if _, ok := result["data"].([]interface{}); !ok {
		t.Fatalf("expected 'data' to be a JSON array, got: %T", result["data"])
	}
}

func TestTransferMarket_NewPlayerAppearsInList(t *testing.T) {
	// Register a new player (auto-listed in transfer market)
	email := uniqueEmail("tm_player")
	username := uniqueUsername("tm_player")
	trackTestUser(email)

	payload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  "Password123!",
		"full_name": "Transfer Market Player",
		"category":  "player",
	}
	regResp, regBody, err := doRequest("POST", "/api/register", payload, "")
	if err != nil || regResp.StatusCode != http.StatusCreated {
		t.Fatalf("registration failed: status=%d body=%s err=%v", regResp.StatusCode, regBody, err)
	}

	// Query transfer market as an owner
	ownerToken, _ := registerTestUser(t, "owner")
	resp, body := helperGetTransferMarket(t, ownerToken, "limit=50")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	data, _ := result["data"].([]interface{})
	for _, item := range data {
		entry, _ := item.(map[string]interface{})
		player, _ := entry["player"].(map[string]interface{})
		if player["username"] != username {
			continue
		}
		// Validate status
		if entry["status"] != "free" {
			t.Errorf("expected status 'available' for new player, got %q", entry["status"])
		}
		// Validate enriched data
		if player["full_name"] != "Transfer Market Player" {
			t.Errorf("expected full_name 'Transfer Market Player', got %q", player["full_name"])
		}
		// Sensitive data must NOT be exposed
		if _, hasPass := player["password_hash"]; hasPass {
			t.Error("transfer market must NOT expose password_hash")
		}
		// listed_at must exist
		if _, hasListedAt := entry["listed_at"]; !hasListedAt {
			t.Error("expected 'listed_at' field in transfer market entry")
		}
		return
	}
	t.Errorf("newly registered player %q not found in transfer market list. Body: %s", username, body)
}

func TestTransferMarket_TransferStatusFree(t *testing.T) {
	managerToken, _ := registerTestUser(t, "manager")

	resp, body := helperGetTransferMarket(t, managerToken, "")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	data, _ := result["data"].([]interface{})
	for i, item := range data {
		entry, _ := item.(map[string]interface{})
		if entry["status"] != "free" {
			t.Errorf("entry[%d] has status %q, expected 'available' (default filter)", i, entry["status"])
		}
	}
}

func TestTransferMarket_PaginationQueryParams(t *testing.T) {
	ownerToken, _ := registerTestUser(t, "owner")

	resp, body := helperGetTransferMarket(t, ownerToken, "page=1&limit=5")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	if result["page"] != float64(1) {
		t.Errorf("expected page=1, got %v", result["page"])
	}
	if result["limit"] != float64(5) {
		t.Errorf("expected limit=5, got %v", result["limit"])
	}

	data, _ := result["data"].([]interface{})
	if len(data) > 5 {
		t.Errorf("expected at most 5 entries with limit=5, got %d", len(data))
	}
}

func TestTransferMarket_InvalidStatusParam(t *testing.T) {
	ownerToken, _ := registerTestUser(t, "owner")

	resp, body := helperGetTransferMarket(t, ownerToken, "status=invalid_status")
	if resp.StatusCode != http.StatusBadRequest {
		t.Errorf("expected 400 Bad Request for invalid status, got %d. Body: %s", resp.StatusCode, body)
	}
}

func TestTransferMarket_NewPlayerAppearsAfterRegistration(t *testing.T) {
	// Register a new player
	email := uniqueEmail("tm_count")
	username := uniqueUsername("tm_count")
	trackTestUser(email)

	payload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  "Password123!",
		"full_name": "Count Test Player",
		"category":  "player",
	}
	regResp, regBody, err := doRequest("POST", "/api/register", payload, "")
	if err != nil || regResp.StatusCode != http.StatusCreated {
		t.Fatalf("registration failed: status=%d body=%s err=%v", regResp.StatusCode, regBody, err)
	}

	// Verify player appears in owner's transfer market view
	ownerToken, _ := registerTestUser(t, "owner")
	resp, body := helperGetTransferMarket(t, ownerToken, "limit=50&page=1")
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("request failed: status=%d body=%s err=%v", resp.StatusCode, body, err)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}
	result, _ := wrapper["data"].(map[string]interface{})

	data, _ := result["data"].([]interface{})
	for _, item := range data {
		entry, _ := item.(map[string]interface{})
		player, _ := entry["player"].(map[string]interface{})
		if player["username"] == username {
			return // Found — test passes
		}
	}
	t.Errorf("newly registered player %q not found in transfer market list after registration", username)
}

func TestTransferMarket_PlayerDataEnrichment(t *testing.T) {
	// Register a player with all optional fields
	email := uniqueEmail("tm_rich")
	username := uniqueUsername("tm_rich")
	trackTestUser(email)

	payload := map[string]string{
		"username":  username,
		"email":     email,
		"password":  "Password123!",
		"full_name": "Enriched Player",
		"category":  "coach",
		"language":  "id",
		"bio":       "Test bio for transfer market",
	}
	regResp, regBody, err := doRequest("POST", "/api/register", payload, "")
	if err != nil || regResp.StatusCode != http.StatusCreated {
		t.Fatalf("registration failed: status=%d body=%s err=%v", regResp.StatusCode, regBody, err)
	}

	ownerToken, _ := registerTestUser(t, "owner")

	// Search across pages to find the newly created player
	for page := 1; page <= 5; page++ {
		resp, body := helperGetTransferMarket(t, ownerToken, fmt.Sprintf("limit=50&page=%d", page))
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("request page %d failed: status=%d body=%s", page, resp.StatusCode, body)
		}

		var wrapper map[string]interface{}
		if err := json.Unmarshal(body, &wrapper); err != nil {
			t.Fatalf("failed to unmarshal page %d: %v", page, err)
		}
		result, _ := wrapper["data"].(map[string]interface{})

		data, _ := result["data"].([]interface{})
		if len(data) == 0 {
			break
		}

		for _, item := range data {
			entry, _ := item.(map[string]interface{})
			player, _ := entry["player"].(map[string]interface{})
			if player["username"] != username {
				continue
			}
			// Validate all required player fields
			for _, field := range []string{"id", "username", "full_name", "category", "language", "bio", "stats", "achievements", "highlights"} {
				if _, ok := player[field]; !ok {
					t.Errorf("expected field %q in player enrichment", field)
				}
			}
			if player["category"] != "coach" {
				t.Errorf("expected category 'coach', got %q", player["category"])
			}
			if player["language"] != "id" {
				t.Errorf("expected language 'id', got %q", player["language"])
			}
			return
		}
	}
	t.Errorf("player %q not found in transfer market list after registration", username)
}

func TestTransferMarket_OwnerAndManagerSeeBothAbleToBrowse(t *testing.T) {
	// Both owner and manager should get 200 — confirm both see the same data structure
	ownerToken, _ := registerTestUser(t, "owner")
	managerToken, _ := registerTestUser(t, "manager")

	for role, token := range map[string]string{"owner": ownerToken, "manager": managerToken} {
		resp, body := helperGetTransferMarket(t, token, "limit=1")
		if resp.StatusCode != http.StatusOK {
			t.Errorf("role %q: expected 200 OK, got %d. Body: %s", role, resp.StatusCode, body)
		}
	}
}
