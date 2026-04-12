# Create Tournament
Creates a new tournament and assigns the requester as its owner.

* **URL:** `/api/create_tournament`
* **Method:** `POST`
* **Required Roles:** `admin` or `organizer`

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Unique tournament ID, 3 to 30 characters, lowercase letters, digits, and underscores only. |

### Example Request

```json
{
  "tournament_id": "kol2026_spring"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Turniej utworzony."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "ID turnieju jest wymagane."}`
* `{"error": "Id turnieju musi mieć co najmniej 3 znaki."}`
* `{"error": "Id turnieju może mieć maksymalnie 30 znaków."}`
* `{"error": "ID może zawierać tylko małe litery, cyfry i podkreślniki (bez spacji)."}`
* `{"error": "Turniej o takim ID już istnieje!"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do tworzenia turniejów."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas tworzenia turnieju."}`
