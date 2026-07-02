package tests

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"njara-platform/internal/domain"
	"github.com/stretchr/testify/assert"
)

func TestUserFollowAndB2CPlayerFlow(t *testing.T) {
	playerToken, playerEmail := registerTestUser(t, "player")
	fanToken, fanEmail := registerTestUser(t, "coach")

	var playerUser domain.User
	testDB.Where("email = ?", playerEmail).First(&playerUser)
	
	var fanUser domain.User
	testDB.Where("email = ?", fanEmail).First(&fanUser)

	// Test 1: Fan follows Player
	t.Run("Fan Follows Player", func(t *testing.T) {
		req := httptest.NewRequest("POST", fmt.Sprintf("/api/b2c/users/%d/follow", playerUser.ID), nil)
		req.Header.Set("Authorization", "Bearer "+fanToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res map[string]interface{}
		json.NewDecoder(resp.Body).Decode(&res)
		assert.Equal(t, "Successfully followed user", res["message"])
	})

	// Test 2: Check follow status
	t.Run("Check Follow Status", func(t *testing.T) {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/b2c/users/%d/follow-status", playerUser.ID), nil)
		req.Header.Set("Authorization", "Bearer "+fanToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Data struct {
				IsFollowing bool `json:"is_following"`
			} `json:"data"`
		}
		json.NewDecoder(resp.Body).Decode(&res)
		assert.True(t, res.Data.IsFollowing)
	})

	// Test 3: Get B2C Player details and verify followers count
	t.Run("Get B2C Player Details", func(t *testing.T) {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/b2c/players/%d", playerUser.ID), nil)
		req.Header.Set("Authorization", "Bearer "+fanToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var res struct {
			Data struct {
				User           domain.User `json:"user"`
				FollowersCount int         `json:"followers_count"`
				FollowingCount int         `json:"following_count"`
			} `json:"data"`
		}
		json.NewDecoder(resp.Body).Decode(&res)
		assert.Equal(t, playerUser.ID, res.Data.User.ID)
		assert.Equal(t, 1, res.Data.FollowersCount)
		assert.Equal(t, 0, res.Data.FollowingCount)
	})

	// Test 4: Cannot Get B2C Player details of non-player (Fan)
	t.Run("Cannot Get B2C Player Details For Non-Player", func(t *testing.T) {
		req := httptest.NewRequest("GET", fmt.Sprintf("/api/b2c/players/%d", fanUser.ID), nil)
		req.Header.Set("Authorization", "Bearer "+playerToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusNotFound, resp.StatusCode)
	})

	// Test 5: Fan unfollows Player
	t.Run("Fan Unfollows Player", func(t *testing.T) {
		req := httptest.NewRequest("DELETE", fmt.Sprintf("/api/b2c/users/%d/unfollow", playerUser.ID), nil)
		req.Header.Set("Authorization", "Bearer "+fanToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Check status again
		req2 := httptest.NewRequest("GET", fmt.Sprintf("/api/b2c/users/%d/follow-status", playerUser.ID), nil)
		req2.Header.Set("Authorization", "Bearer "+fanToken)

		resp2, err := testApp.Test(req2)
		assert.NoError(t, err)

		var res2 struct {
			Data struct {
				IsFollowing bool `json:"is_following"`
			} `json:"data"`
		}
		json.NewDecoder(resp2.Body).Decode(&res2)
		assert.False(t, res2.Data.IsFollowing)
	})
}
