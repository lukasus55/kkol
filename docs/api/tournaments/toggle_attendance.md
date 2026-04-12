# Toggle Attendance
Toggles a player's attendance status in a tournament.

* **URL:** `/api/toggle_attendance`
* **Method:** `POST`
* **Required Roles:** `owner` or `manager`

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Target tournament ID. |
| `target_player_id` | String | Yes | Player ID whose attendance will change. |

### Example Request

```json
{
  "tournament_id": "kol2026_spring",
  "target_player_id": "kukula"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Status obecności został zmieniony."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Invalid payload"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do edycji tego turnieju."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zmiany statusu obecności."}`
