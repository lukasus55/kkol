# Fetch Events
Returns event data for the calendar. Supports optional tournament or player filtering.

* **URL:** `/api/events`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `tournament` | String | No | Filter events by tournament ID. |
| `player` | String | No | Filter events for tournaments where the player has results. |

### Example Requests

```http
GET /api/events
```

```http
GET /api/events?tournament=kol2024
```

```http
GET /api/events?player=123
```

---

## Success Response
**Code:** `200 OK`

```json
[
  {
    "id": 142,
    "title": "Turniej Wiosenny",
    "start": "2024-05-15T12:00:00",
    "end": "2024-05-15T18:00:00",
    "backgroundColor": "var(--color-lime-moss)",
    "borderColor": "var(--color-lime-moss)",
    "textColor": "var(--color-lavender-mist)",
    "extendedProps": {
      "tournament_id": "kol2024",
      "creator_id": 7,
      "is_major": true
    }
  }
]
```

## Responses

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas pobierania wydarzeń."}`
