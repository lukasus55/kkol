# Login
Authenticates a player and sets a session cookie.

* **URL:** `/api/login`
* **Method:** `POST`
* **Required Roles:** none

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `username` | String | Yes | Player ID used to log in. |
| `password` | String | Yes | Player password. |

### Example Request

```json
{
  "username": "damidami2",
  "password": "secret123"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Login successful!",
  "user": {
    "id": "damidami2",
    "role": "admin"
  }
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Username and password are required"}`

**Code:** `401 Unauthorized`
* `{"error": "Invalid username or password"}`

**Code:** `403 Forbidden`
* `{"error": "This account has been disabled."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Internal server error during login"}`
