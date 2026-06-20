package tests

import (
	"encoding/json"
	"net/http"
	"testing"
)

// ---------------------------------------------------------------------------
// GET /api/players, /api/coaches, etc.
// ---------------------------------------------------------------------------

func TestGetListByCategory_Players(t *testing.T) {
	// Register a player
	email := uniqueEmail("player_list")
	trackTestUser(email)
	payload := map[string]interface{}{
		"username":  uniqueUsername("player_list"),
		"email":     email,
		"password":  "Pass123!",
		"full_name": "List Player",
		"category":  "player",
		// Provide some arbitrary contract that should be forced to null because it's a new user (Free Agent)
		"salary": 100000,
	}

	respReg, bodyReg, err := doRequest("POST", "/api/register", payload, "")
	if err != nil || respReg.StatusCode != http.StatusCreated {
		t.Fatalf("setup registration failed: %v", err)
	}

	var regWrap map[string]interface{}
	json.Unmarshal(bodyReg, &regWrap)
	regData, _ := regWrap["data"].(map[string]interface{})
	token, _ := regData["token"].(string)

	// Fetch players list using the token
	resp, body, err := doRequest("GET", "/api/players", nil, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	if err := json.Unmarshal(body, &wrapper); err != nil {
		t.Fatalf("failed to unmarshal: %v", err)
	}

	data, ok := wrapper["data"].([]interface{})
	if !ok {
		t.Fatalf("expected 'data' array in response")
	}

	found := false
	for _, item := range data {
		userObj, _ := item.(map[string]interface{})
		if userObj["email"] == email {
			found = true
			if userObj["category"] != "player" {
				t.Errorf("expected category 'player', got %q", userObj["category"])
			}
			// Contract and salary MUST be null for Free Agent!
			if userObj["salary"] != nil {
				t.Errorf("expected salary to be null, got %v", userObj["salary"])
			}
			if userObj["contract_until"] != nil {
				t.Errorf("expected contract_until to be null, got %v", userObj["contract_until"])
			}
		}
	}

	if !found {
		t.Errorf("expected player %q to be found in /api/players list", email)
	}
}

func TestGetListByCategory_Coaches(t *testing.T) {
	// Register a coach
	email := uniqueEmail("coach_list")
	trackTestUser(email)
	payload := map[string]interface{}{
		"username":  uniqueUsername("coach_list"),
		"email":     email,
		"password":  "Pass123!",
		"full_name": "List Coach",
		"category":  "coach",
	}

	respReg, bodyReg, err := doRequest("POST", "/api/register", payload, "")
	if err != nil || respReg.StatusCode != http.StatusCreated {
		t.Fatalf("setup registration failed: %v", err)
	}

	var regWrap map[string]interface{}
	json.Unmarshal(bodyReg, &regWrap)
	regData, _ := regWrap["data"].(map[string]interface{})
	token, _ := regData["token"].(string)

	// Fetch coaches list
	resp, body, err := doRequest("GET", "/api/coaches", nil, token)
	if err != nil {
		t.Fatalf("request error: %v", err)
	}
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d. Body: %s", resp.StatusCode, body)
	}

	var wrapper map[string]interface{}
	json.Unmarshal(body, &wrapper)
	data, _ := wrapper["data"].([]interface{})

	found := false
	for _, item := range data {
		userObj, _ := item.(map[string]interface{})
		if userObj["email"] == email {
			found = true
			if userObj["category"] != "coach" {
				t.Errorf("expected category 'coach', got %q", userObj["category"])
			}
		}
	}

	if !found {
		t.Errorf("expected coach %q to be found in /api/coaches list", email)
	}
}

func TestCategoryRegistration_StaffAndBA(t *testing.T) {
	testCases := []string{"staff", "ba"}
	for _, cat := range testCases {
		t.Run(cat, func(t *testing.T) {
			email := uniqueEmail(cat + "_test")
			trackTestUser(email)
			payload := map[string]interface{}{
				"username":  uniqueUsername(cat + "_test"),
				"email":     email,
				"password":  "Pass123!",
				"full_name": "Test " + cat,
				"category":  cat,
			}

			resp, body, err := doRequest("POST", "/api/register", payload, "")
			if err != nil || resp.StatusCode != http.StatusCreated {
				t.Fatalf("failed to register %s: %d %s", cat, resp.StatusCode, body)
			}

			var wrapper map[string]interface{}
			json.Unmarshal(body, &wrapper)
			result, _ := wrapper["data"].(map[string]interface{})
			userObj, _ := result["user"].(map[string]interface{})

			if userObj["category"] != cat {
				t.Errorf("expected registered user to have category %q, got %q", cat, userObj["category"])
			}
		})
	}
}


