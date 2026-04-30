# Update Event
Edits an existing event's start and end date..

* **URL:** `/api/event_update`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | Exact ID of the event to update. |
| `start_date` | TIMESTAMPTZ | Yes | Valid date between 01.01.2024 and today + 500 days. |
| `end_date` | TIMESTAMPTZ | No | Valid date. Must be chronologically after `start_date`. |

### Example Request

```json
{
  "id": 142,
  "start_date": "2024-06-20T10:00:00",
  "end_date": "2024-06-20T16:00:00"
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
* `{"error": "Brakujące dane do edycji."}`
* `{"error": "Nieprawidłowy format daty początkowej."}`
* `{"error": "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód."}`
* `{"error": "Nieprawidłowy format daty końcowej."}`
* `{"error": "Data końcowa musi zawierać się między 2024 rokiem a okresem 500 dni w przód."}`
* `{"error": "Data końcowa nie może być wcześniejsza niż data początkowa."}`
* `{"error": "Nie możesz edytować wydarzeń w zakończonym turnieju."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju."}`

**Code:** `404 Not Found`
* `{"error": "Wydarzenie nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas edycji wydarzenia."}`
