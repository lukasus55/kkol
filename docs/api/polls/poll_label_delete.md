# Delete Poll Label
Deletes an existing poll label.

* **URL:** `/api/poll_label_delete`
* **Method:** `POST`
* **Required Roles:** `admin`, `owner`, `manager`, or a participant allowed by the poll's rights level

---

## Request Payload

| Field | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | ID of the label to delete. |

### Example Request

```json
{
  "id": "13"
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
* `{"error": "Brakujące dane (Id etykiety)."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do usunięcia etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać."}`

**Code:** `404 Not Found`
* `{"error": "Nie możesz usunąć etykiety która nie istnieje."}`
* `{"error": "Nie możesz usunąć etykiety do ankiety która nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas usuwania etykiety."}`
