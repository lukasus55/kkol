# Create Event
Creates a new event and assigns it to an active, unfinished tournament.

* **URL:** `/api/event_create`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of an existing, active tournament. |
| `name` | String | Yes | Name of the event. Must be 3 to 70 characters. |
| `is_major` | Boolean | Yes | Marks if the event is a major (`true`) or minor (`false`). |
| `start_date` | TIMESTAMPTZ | Yes | Valid date between 01.01.2024 and today + 500 days. |
| `end_date` | TIMESTAMPTZ | No | Valid date. Must be chronologically after `start_date`. |

### Example Request

```json
{
  "tournament_id": "kol2024",
  "name": "Turniej Wiosenny",
  "is_major": true,
  "start_date": "2024-05-15T12:00:00",
  "end_date": "2024-05-15T18:00:00"
}
```

---(tournament-specific)

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "success": true,
  "id": 142
}
```

### Error Responses

**Code:** `400 Bad Request`  
*Returns specific validation errors based on the user's input:*
* `{"error": "Brakujące dane (Turniej, Nazwa lub Data)."}`
* `{"error": "Nazwa wydarzenia musi mieć co najmniej 3 znaki."}`
* `{"error": "Nie możesz dodać wydarzenia do zakończonego turnieju."}`
* `{"error": "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód."}`

**Code:** `401 Unauthorized`  
*Returned if the user's JWT cookie is missing or expired:*
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`  
*Returned if a logged-in user tries to create an event in a tournament they do not manage:*
* `{"error": "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju."}`