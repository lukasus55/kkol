# GD Data
Returns GD level definitions and score data.

* **URL:** `/api/gd`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

This endpoint does not require query parameters.

### Example Request

```http
GET /api/gd
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "levels": [
    {
      "id": 1,
      "name": "Level 1",
      "difficulty": "Easy",
      "finished": false,
      "players": [
        {
          "id": "damidami2",
          "position": 1,
          "score": 120
        }
      ]
    }
  ]
}
```

### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to fetch GD data"}`
