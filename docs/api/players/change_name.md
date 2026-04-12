# Change Name
Updates the logged-in player's displayed name.

* **URL:** `/api/change_name`
* **Method:** `POST`
* **Required Roles:** authenticated user

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `new_name` | String | Yes | New display name. Must be 3 to 30 characters. |

### Example Request

```json
{
  "new_name": "NowaNazwa"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Nazwa została zaktualizowana."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Nazwa musi mieć co najmniej 3 znaki."}`
* `{"error": "Nazwa może mieć maksymalnie 30 znaków."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `404 Not Found`
* `{"error": "Nie znaleziono użytkownika."}`

**Code:** `429 Too Many Requests`
* `{"error": "Musisz odczekać jeszcze X minut przed kolejną zmianą nazwy."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zmiany nazwy."}`
