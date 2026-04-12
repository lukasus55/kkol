# Fetch Tournaments
Returns tournament metadata and standings.

* **URL:** `/api/tournaments`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | No | Filter by a single tournament ID. |

### Example Requests

```http
GET /api/tournaments
```

```http
GET /api/tournaments?id=kol2026_spring
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "kol2026_spring": {
    "id": "kol2026_spring",
    "displayed_name": "KOL 2026 Spring",
    "page_exists": true,
    "page_url": "/tournaments/kol2026_spring",
    "finished": false,
    "standings": [
      {
        "position": 1,
        "id": "damidami2"
      }
    ],
    "details": {
      "timestamp": 1710000000,
      "displayed_date": "15 May 2026",
      "players": 32,
      "tier": "A"
    }
  }
}
```

## Responses

### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load tournaments"}`
