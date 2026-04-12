# Active Tournaments
Returns unfinished tournaments accessible by the authenticated user.

* **URL:** `/api/tournaments_active`
* **Method:** `GET`
* **Required Roles:** authenticated user

---

## Query Parameters

This endpoint does not require query parameters.

### Example Request

```http
GET /api/tournaments_active
```

---

## Success Response
**Code:** `200 OK`

```json
[
	{
		"id": "kol2026",
		"displayed_name": "SEZON 2026"
	}
]
```

## Responses

### Error Responses

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Nie udało się pobrać listy turniejów."}`
