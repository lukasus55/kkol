# Delete Poll
Deletes an existing poll if the requester has permission for its tournament.

* **URL:** `/api/poll_delete`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | ID of the poll to delete. |

### Example Request

```json
{
  "id": "019ea87b-dfcc-74be-ac9c-2bcc2f0a5eb8"
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
* `{"error": "Brak ID ankiety do usunięcia."}`
* `{"error": "Nie możesz edytować ankiety w turnieju, który nie istnieje."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do usunięcia tej ankiety. Musisz być administratorem lub zarządcą tego turnieju."}`

**Code:** `404 Not Found`
* `{"error": "Nie możesz usunać ankiety która nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas usuwania wydarzenia."}`
