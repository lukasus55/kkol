# Kick Player
Removes a player from a tournament.

* **URL:** `/api/kick_player`
* **Method:** `POST`
* **Required Roles:** `owner` (tournament-specific) or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Target tournament ID. |
| `target_player_id` | String | Yes | ID of the player to remove. |

### Example Request

```json
{
  "tournament_id": "kol2026",
  "target_player_id": "kukula"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Gracz został wyrzucony."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Invalid payload"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do wyrzucania graczy."}`
* `{"error": "Nie można wyrzucić właściciela turnieju."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas wyrzucania gracza."}`
