# Fetch KKKOL ranking
Returns kkol ranking leaderboard.

* **URL:** `/api/ranking`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | No | Filter by a single player ID. |

### Example Requests
```http
GET /api/ranking
```

```http
GET /api/ranking?id=damidami2
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
[
	{
		"id": "damidami2",
		"name": "DamiDami2",
		"pfpSrc": "...",
		"majorRanking": "5.00",
		"minorRanking": "1.00",
		"ranking": "6.00"
	}
]
```

#### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load KKOL ranking"}`
