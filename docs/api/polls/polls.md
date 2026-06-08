# Fetch Polls
Returns poll data with optional filtering by poll ID, tournament, or player.

* **URL:** `/api/polls`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | String | No | Fetch a specific poll by ID. |
| `tournament` | String | No | Fetch polls belonging to a specific tournament. |
| `player` | String | No | Fetch polls for tournaments where the player has results. |
| `limit` | Number | No | Maximum number of polls to return, up to 100. |
| `order` | String | No | Sort order by `end_date`: `reversed` for ascending, default is descending. |

### Example Requests

```http
GET /api/polls
```

```http
GET /api/polls?tournament=kol2024
```

```http
GET /api/polls?player=123
```

```http
GET /api/polls?id=abc123
```

```http
GET /api/polls?limit=10&order=reversed
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
[
  {
    "id": "019ea87b-dfcc-74be-ac9c-2bcc2f0a5eb8",
    "tournament_id": "kol2026",
    "creator_id": "kostys",
    "name": "Poll Name",
    "create_default_options": false,
    "rights_level": 1,
    "start_date": "2026-02-01T11:00:00.000Z",
    "end_date": "2026-02-10T11:00:00.000Z"
  }
]
```

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load polls"}`
