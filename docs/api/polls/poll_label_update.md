# Update Poll Label
Updates an existing poll label.

* **URL:** `/api/poll_label_update`
* **Method:** `POST`
* **Required Roles:** `admin`, `owner`, `manager`, or a participant allowed by the poll's rights level

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `id` | String | Yes | ID of the label to update. |
| `name` | String | Yes | New label name. Must be 3 to 30 characters. |
| `hex` | String | Yes | New label color in HEX format. |
| `description` | String | No | Optional description. Max 500 characters. |

### Example Request

```json
{
  "id": "13",
  "name": "Hard",
  "hex": "#ff8c42",
  "description": "Updated difficulty label"
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
* `{"error": "Brakujące dane (Id etykiety, Nazwa lub Hex)."}`
* `{"error": "Nazwa etykiety musi mieć co najmniej 3 znaki."}`
* `{"error": "Nazwa etykiety może mieć maksymalnie 30 znaków."}`
* `{"error": "Opis etykiety może mieć maksymalnie 500 znaków."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do edycji etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać."}`

**Code:** `404 Not Found`
* `{"error": "Nie możesz edytować etykiety która nie istnieje."}`
* `{"error": "Nie możesz dodać etykiety do ankiety która nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas edycji etykiety."}`
