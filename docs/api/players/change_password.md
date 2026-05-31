# Change Name
Updates the logged-in player's password.

* **URL:** `/api/change_password`
* **Method:** `POST`
* **Required Roles:** authenticated user

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `old_password` | String | Yes | Used to authenticate user again. |
| `new_password` | String | Yes | New password. Must be 14 to 128 characters, not numbers only, and not on the pwned passwords list. |

### Example Request

```json
{
  "old_password": "Z3)r_^R^8SZWHH<h7",
  "new_password": "|#3LW/'^8)1jn1[bK1s",
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Hasło zostało pomyślnie zaktualizowane."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Nowe hasło nie może być takie samo jak stare."}`
* `{"error": "Hasło musi mieć co najmniej 14 znaków."}`
* `{"error": "Hasło musi mieć maksymalnie 128 znaków."}`
* `{"error": "Hasło nie może być na liście słabych i wykradzionych haseł."}`
* `{"error": "Hasło nie może składać się wyłącznie z cyfr."}`
* `{"error": "Wypełnij wszystkie wymagane pola."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Konto jest nieaktywne."}`

**Code:** `404 Not Found`
* `{"error": "Nie znaleziono użytkownika."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zmiany hasła."}`
