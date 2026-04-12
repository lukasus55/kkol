# Me
Returns profile and tournament data for the authenticated user.

* **URL:** `/api/me`
* **Method:** `GET`
* **Required Roles:** authenticated user

---

## Query Parameters

This endpoint does not require query parameters.

### Example Request

```http
GET /api/me
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "user": {
    "id": "damidami2",
    "displayed_name": "Dami",
    "role": "organizer",
    "is_active": true,
    "email": "dam@example.com",
    "organizer_roles": {
      "kol2026_spring": "owner"
    },
    "tournaments": {
      "kol2026_spring": {
        "id": "kol2026_spring",
        "attended": true,
        "position": 1,
        "total_points": 42,
        "games_positions": [1,2],
        "games_points": [21,21]
      }
    },
    "pfp_base64": "..."
  }
}
```

## Responses

### Error Responses

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`
* `{"error": "Invalid or expired session"}`

**Code:** `500 Internal Server Error`
* `{"error": "Invalid or expired session"}`
