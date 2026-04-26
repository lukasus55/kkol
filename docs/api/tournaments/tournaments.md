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
| `player` | String | No | Filter by a single player ID. Returns only tournaments attended by a specific player.|

### Example Requests

```http
GET /api/tournaments
```

```http
GET /api/tournaments?id=kol2026
```

```http
GET /api/tournaments?player=harnas
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
    "kol2026": {
        "id": "kol2026",
        "displayed_name": "SEZON 2026",
        "page_exists": true,
        "page_url": "2026",
        "finished": false,
        "standings": [
            {
                "position": 1,
                "id": "damidami2"
            },
            {
                "position": 1,
                "id": "harnas"
            },
            {
                "position": 1,
                "id": "kostys"
            },
            {
                "position": 1,
                "id": "kukula"
            }
        ],
        "details": {
            "timestamp": "1798714800",
            "displayed_date": "2026 ",
            "players": 4,
            "tier": "S"
        }
    }
}
```

### Error Responses

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load tournaments"}`
