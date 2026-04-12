# Fetch Players
Returns player profiles and attended tournament results.

* **URL:** `/api/players`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | No | Filter by a single player ID. |
| `tournament` | String | No | Filter players by tournament ID. |

### Example Requests

```http
GET /api/players
```

```http
GET /api/players?id=damidami2
```

```http
GET /api/players?tournament=kol2026_spring
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "damidami2": {
    "id": "damidami2",
    "displayed_name": "Dami",
    "pfp_base64": "...",
    "tournaments": {
      "kol2026_spring": {
        "id": "kol2026_spring",
        "finished": false,
        "position": 1,
        "total_points": 42,
        "games_positions": [1,2],
        "games_points": [21,21]
      }
    }
  }
}
```

## Responses

### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load complete players"}`
