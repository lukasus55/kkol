# Logout
Clears the authentication cookie and ends the current session.

* **URL:** `/api/logout`
* **Method:** `POST`
* **Required Roles:** none

---

## Request Payload

This endpoint does not require a request body.

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Logged out successfully"
}
```

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Internal server error during logout"}`
