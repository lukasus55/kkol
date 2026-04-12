# Add Player
Adds a player to a tournament.

* **URL:** `/api/add_player`
* **Method:** `POST`
* **Required Roles:** `owner` or `manager`

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Target tournament ID. |
| `new_player_id` | String | Yes | ID of the player to add. |

### Example Request

```json
{
  "tournament_id": "kol2026_spring",
  "new_player_id": "kukula"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Gracz został dodany."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Musisz podać ID gracza."}`
* `{"error": "Ten gracz jest już zapisany do tego turnieju."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do dodawania graczy."}`

**Code:** `404 Not Found`
* `{"error": "Gracz o ID \"<id>\" nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas dodawania gracza."}`
