# Create Poll Label
Creates a new label for an existing poll.

* **URL:** `/api/poll_label_create`
* **Method:** `POST`
* **Required Roles:** `admin`, `owner`, `manager`, or a participant allowed by the poll's rights level

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `poll` | String | Yes | ID of the poll that should receive the label. |
| `name` | String | Yes | Label name. Must be 3 to 30 characters. |
| `hex` | String | Yes | Label color in HEX format. |
| `description` | String | No | Optional description. Max 500 characters. |

### Example Request

```json
{
  "poll": "019ea87b-dfcc-74be-ac9c-2bcc2f0a5eb8",
  "name": "Hard",
  "hex": "#ff8c42",
  "description": "Difficult level"
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
* `{"error": "Brakujące dane (Nazwa, Hex lub Id ankiety)."}`
* `{"error": "Nazwa etykiety musi mieć co najmniej 3 znaki."}`
* `{"error": "Nazwa etykiety może mieć maksymalnie 30 znaków."}`
* `{"error": "Opis etykiety może mieć maksymalnie 500 znaków."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do dodania etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać."}`

**Code:** `404 Not Found`
* `{"error": "Nie możesz dodać etykiety do ankiety która nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas tworzenia etykiety."}`
