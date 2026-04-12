# Delete Event
Deletes an existing event by ID.

* **URL:** `/api/event_delete`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | Exact ID of the event to delete. |

### Example Request

```json
{
  "id": 142
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
* `{"error": "Brak ID wydarzenia do usunięcia."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do usunięcia tego wydarzenia. Musisz być administratorem lub zarządcą tego turnieju."}`

**Code:** `404 Not Found`
* `{"error": "Wydarzenie nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas usuwania wydarzenia."}`
