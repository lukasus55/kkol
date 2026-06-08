# Create Poll
Creates a new poll for an active, unfinished tournament.

* **URL:** `/api/poll_create`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of an existing, active tournament. |
| `name` | String | Yes | Name of the poll. Must be 3 to 70 characters. |

### Example Request

```json
{
  "tournament_id": "kol2024",
  "name": "Game ideas poll"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "success": true,
  "id": "019ea87b-dfcc-74be-ac9c-2bcc2f0a5eb8"
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brakujące dane (Nazwa lub Id turnieju)."}`
* `{"error": "Nazwa ankiety musi mieć co najmniej 3 znaki."}`
* `{"error": "Nazwa ankiety może mieć maksymalnie 70 znaków."}`
* `{"error": "Nie możesz dodać ankiety do turnieju, który nie istnieje."}`
* `{"error": "Nie możesz dodać ankiety do zakończonego turnieju."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas tworzenia wydarzenia."}`
