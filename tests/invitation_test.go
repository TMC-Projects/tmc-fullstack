package tests

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"testing"
	"time"

	"njara-platform/internal/domain"
	"njara-platform/internal/infrastructure/postgres"

	"github.com/stretchr/testify/assert"
)

func TestInvitationFlow(t *testing.T) {
	// 1. Create a club owner
	ownerToken, ownerEmail := registerTestUser(t, "owner")
	
	var ownerUser postgres.UserModel
	testDB.Where("email = ?", ownerEmail).First(&ownerUser)
	
	club := &postgres.ClubModel{
		Name:        fmt.Sprintf("Test FC Invite %d", time.Now().UnixNano()),
		Country:     "Indonesia",
		Verify:      true, // must be verified to use B2B features
		Status:      "full",
	}
	testDB.Create(club)
	
	// Assign owner to the club
	testDB.Model(&postgres.UserModel{}).Where("id = ?", ownerUser.ID).Update("club_id", club.ID)

	// 2. Create a free agent player
	playerToken, playerEmail := registerTestUser(t, "player")
	
	var playerUser postgres.UserModel
	testDB.Where("email = ?", playerEmail).First(&playerUser)

	var invitationID int64

	t.Run("Owner_Invites_Free_Agent", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]interface{}{
			"team_id": nil,
		})

		req, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/talents/%d/sign", playerUser.ID), bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ownerToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify invitation is created in DB
		var inv postgres.TeamInvitationModel
		testDB.Where("player_id = ? AND club_id = ?", playerUser.ID, club.ID).First(&inv)
		assert.NotZero(t, inv.ID)
		assert.Equal(t, "pending", inv.Status)
		invitationID = inv.ID
	})

	t.Run("Owner_Invites_Same_Free_Agent_Again", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]interface{}{})
		req, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/talents/%d/sign", playerUser.ID), bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+ownerToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusBadRequest, resp.StatusCode) // Should prevent duplicate pending invites
	})

	t.Run("Player_Gets_Invitations", func(t *testing.T) {
		req, _ := http.NewRequest(http.MethodGet, "/api/b2c/invitations", nil)
		req.Header.Set("Authorization", "Bearer "+playerToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		var resBody struct {
			Success bool                    `json:"success"`
			Data    []domain.TeamInvitation `json:"data"`
		}
		json.NewDecoder(resp.Body).Decode(&resBody)
		assert.True(t, resBody.Success)
		assert.Len(t, resBody.Data, 1)
		assert.Equal(t, "pending", resBody.Data[0].Status)
	})

	t.Run("Player_Accepts_Invitation", func(t *testing.T) {
		reqBody, _ := json.Marshal(map[string]interface{}{
			"accept": true,
		})

		req, _ := http.NewRequest(http.MethodPost, fmt.Sprintf("/api/b2c/invitations/%d/respond", invitationID), bytes.NewBuffer(reqBody))
		req.Header.Set("Content-Type", "application/json")
		req.Header.Set("Authorization", "Bearer "+playerToken)

		resp, err := testApp.Test(req)
		assert.NoError(t, err)
		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// Verify DB status
		var inv postgres.TeamInvitationModel
		testDB.First(&inv, invitationID)
		assert.Equal(t, "accepted", inv.Status)

		// Verify player club is updated
		var updatedPlayer postgres.UserModel
		testDB.First(&updatedPlayer, playerUser.ID)
		assert.Equal(t, club.ID, updatedPlayer.ClubID)
	})
}
