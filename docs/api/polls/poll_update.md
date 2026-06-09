# Update Poll
Updates an existing poll's name, dates, and rights level.

* **URL:** `/api/poll_update`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | ID of the poll to update. |
| `name` | String | Yes | New poll name. Must be 3 to 70 characters. |
| `start_date` | TIMESTAMPTZ | Yes | Valid start date between 2024 and 500 days in the future. |
| `end_date` | TIMESTAMPTZ | Yes | Valid end date, not earlier than `start_date`. |
| `rights_level` | String | Yes | Access level for the poll. |

### Example Request

```json
{
  "id": "019ea87b-dfcc-74be-ac9c-2bcc2f0a5eb8",
  "name": "Updated Poll Name",
  "start_date": "2026-02-01T12:00:00",
  "end_date": "2026-02-10T18:00:00",
  "rights_level": "public"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "success": true
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brakujące dane."}`
* `{"error": "Nazwa ankiety musi mieć co najmniej 3 znaki."}`
* `{"error": "Nazwa ankiety może mieć maksymalnie 70 znaków."}`
* `{"error": "Nieprawidłowy format daty początkowej."}`
* `{"error": "Nieprawidłowy format daty końcowej."}`
* `{"error": "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód."}`
* `{"error": "Data końcowa nie może być wcześniejsza niż data początkowa."}`
* `{"error": "Nie możesz edytować ankiety w turnieju, który nie istnieje."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień. Musisz być administratorem lub zarządcą turnieju do którego przypisana jest ta ankieta."}`

**Code:** `404 Not Found`
* `{"error": "Nie możesz edytować ankiety która nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas tworzenia wydarzenia."}`
