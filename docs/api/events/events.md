# Fetch Events
Returns event data in either calendar or list format. Supports optional tournament or player filtering.

* **URL:** `/api/events`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `tournament` | String | No | Filter events by tournament ID. |
| `player` | String | No | Filter events for tournaments where the player has results. |
| `format` | String | No | Output format: `calendar` (default) or `list`. |

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

```http
GET /api/events?player=kosty&format=calendar
```

```http
GET /api/events?format=list
```

---

## Responses

### `format=calendar` (default)
Returns data in FullCalendar-compatible format.

**Code:** `200 OK`

```json
[
	{
		"id": 34,
		"title": "Start Geometry Dash",
		"start": "2026-02-01T11:00:00.000Z",
		"end": null,
		"backgroundColor": "var(--color-lime-moss)",
		"borderColor": "var(--color-lime-moss)",
		"textColor": "var(--color-lavender-mist)",
		"extendedProps": {
			"tournament_id": "kol2026",
			"creator_id": "kostys",
			"is_major": true
		}
	}
]
```

### `format=list`
Returns data in list format, similar to other API endpoints.

**Code:** `200 OK`

```json
[
	{
		"id": 34,
		"tournament_id": "kol2026",
		"creator_id": "kostys",
		"event_date": "2026-02-01T11:00:00.000Z",
		"end_date": null,
		"name": "Start Geometry Dash",
		"is_major": true
	}
]
```

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas pobierania wydarzeń."}`
