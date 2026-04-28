# Fetch Events
Return results of event.

* **URL:** `/api/event_results`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `id` | Number | Yes | Filter events by event ID. |

### Example Requests

```http
GET /api/event_results?id=42
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
[
	{
		"player_id": "kukula",
		"position": null,
		"points": null,
		"event_id": 42
	},
	{
		"player_id": "kostys",
		"position": 1,
		"points": "78.00",
		"event_id": 42
	}
]
```

### Error Responses

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed."}`

**Code:** `422 Unprocessable Entity`
* `{"error": "ID paramater is mandatory."}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load Event Results."}`
