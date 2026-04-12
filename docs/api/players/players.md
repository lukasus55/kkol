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
GET /api/players?tournament=kol2026
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "damidami2": {
    "id": "damidami2",
    "displayed_name": "DamiDami2",
    "pfp_base64": "...",
    "tournaments": {
			"kol2024": {
				"id": "kol2024",
				"finished": true,
				"position": 4,
				"total_points": 12,
				"games_positions": [2,4,1,3],
				"games_points": [3,4,1,4]
            }
      }
    }
}
```

## Responses

### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load complete players"}`
