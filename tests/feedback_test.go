package tests

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestFeedbackFlow(t *testing.T) {
	// Register a test user
	token, _ := registerTestUser(t, "player")

	t.Run("Submit Feedback Success", func(t *testing.T) {
		reqBody := map[string]string{
			"message": "This is a great app, but it needs more features.",
		}
		jsonValue, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/b2c/feedback", bytes.NewBuffer(jsonValue))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		var res map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&res)

		assert.Equal(t, "Feedback submitted successfully", res["message"])
		data := res["data"].(map[string]interface{})
		assert.Equal(t, reqBody["message"], data["message"])
		assert.NotNil(t, data["id"])
		assert.NotNil(t, data["user_id"])
	})

	t.Run("Submit Feedback Empty Message", func(t *testing.T) {
		reqBody := map[string]string{
			"message": "   ", // spaces should be trimmed and fail
		}
		jsonValue, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/b2c/feedback", bytes.NewBuffer(jsonValue))
		req.Header.Set("Authorization", "Bearer "+token)
		req.Header.Set("Content-Type", "application/json")

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode)

		var res map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&res)

		assert.Equal(t, "Message is required", res["message"])
	})

	t.Run("Submit Feedback Unauthorized", func(t *testing.T) {
		reqBody := map[string]string{
			"message": "This is a great app",
		}
		jsonValue, _ := json.Marshal(reqBody)

		req := httptest.NewRequest("POST", "/api/b2c/feedback", bytes.NewBuffer(jsonValue))
		req.Header.Set("Content-Type", "application/json")

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
	})
}
