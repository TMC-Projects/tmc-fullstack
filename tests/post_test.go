package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
)

func TestPostEndpoints(t *testing.T) {
	// Register user
	token, _ := registerTestUser(t, "player")

	var postID float64

	t.Run("Create Post", func(t *testing.T) {
		payload := map[string]string{
			"content": "<p>Hello world!</p>",
		}
		resp, body, err := doRequest("POST", "/api/b2c/posts", payload, token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("expected 201, got %d. Body: %s", resp.StatusCode, body)
		}

		var res map[string]interface{}
		json.Unmarshal(body, &res)
		data := res["data"].(map[string]interface{})
		postID = data["ID"].(float64)
	})

	t.Run("Get Feed", func(t *testing.T) {
		resp, body, err := doRequest("GET", "/api/b2c/posts", nil, token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d. Body: %s", resp.StatusCode, body)
		}

		var res map[string]interface{}
		json.Unmarshal(body, &res)
		data := res["data"].([]interface{})
		if len(data) == 0 {
			t.Fatalf("expected feed to have posts")
		}
	})

	t.Run("Toggle Like", func(t *testing.T) {
		url := fmt.Sprintf("/api/b2c/posts/%d/like", int(postID))
		resp, body, err := doRequest("POST", url, nil, token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d. Body: %s", resp.StatusCode, body)
		}
	})

	t.Run("Add Comment", func(t *testing.T) {
		url := fmt.Sprintf("/api/b2c/posts/%d/comments", int(postID))
		payload := map[string]string{
			"content": "Nice post!",
		}
		resp, body, err := doRequest("POST", url, payload, token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusCreated {
			t.Fatalf("expected 201, got %d. Body: %s", resp.StatusCode, body)
		}
	})

	t.Run("Get Comments", func(t *testing.T) {
		url := fmt.Sprintf("/api/b2c/posts/%d/comments", int(postID))
		resp, body, err := doRequest("GET", url, nil, token)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if resp.StatusCode != http.StatusOK {
			t.Fatalf("expected 200, got %d. Body: %s", resp.StatusCode, body)
		}
	})
}
