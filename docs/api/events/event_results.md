# Fetch Events
Return results of event. Sorted based on event_date (start date).

* **URL:** `/api/event_results`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | Number | Partially* | Filter events by event ID. |
| `tournament` | String | Partially* | Filter events by tournament ID. |
| `player` | String | Partially* | Filter events by player ID. |
| `major` | Boolean | No | Filter events by is_major_event. |

> Note: Either id, tournament or player parameter is required.

### Example Requests

```http
GET /api/event_results?id=42
```

```http
GET /api/event_results?tournament=kol2026
```

```http
GET /api/event_results?player=kostys
```

```http
GET /api/event_results?tournament=kol2026&major=true
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
[
	{
		"event_id": 42,
		"event_name": "GD - Deadlocked, Randomiser, Theory of Everything 2",
		"is_major_event": false,
		"tournament_id": "kol2026",
		"results": [
			{
				"player_id": "kostys",
				"displayed_name": "Kostyś",
				"position": 1,
				"points": "78.00"
			},
			{
				"player_id": "kukula",
				"displayed_name": "Kukuła",
				"position": null,
				"points": null
			}
		]
	}
]
```

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed."}`

**Code:** `422 Unprocessable Entity`
* `{"error": "ID, tournament or player parameter is mandatory."}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load Event Results."}`
