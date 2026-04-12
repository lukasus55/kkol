# Me
Returns profile and tournament data for the authenticated user.

* **URL:** `/api/me`
* **Method:** `GET`
* **Required Roles:** authenticated user

---

## Query Parameters

This endpoint does not require query parameters.

### Example Request

```http
GET /api/me
```

---

## Success Response
**Code:** `200 OK`

```json
{
	"user": {
		"id": "kostys",
		"displayed_name": "Kostyś",
		"role": "admin",
		"is_active": true,
		"email": "exampleEmail@example.com",
		"organizer_roles": {
			"kol2024": "owner",
			"monopolyE1": "manager",
		},
		"tournaments": {
			"kol2024": {
				"id": "kol2024",
				"attended": true,
				"position": 2,
				"total_points": 16,
				"games_positions": [3,1,3,1],
				"games_points": [2,4,2,8]
			},
			"monopolyE1": {
				"id": "monopolyE1",
				"attended": true,
				"position": 2,
				"total_points": null,
				"games_positions": null,
				"games_points": null
			}
		},
		"pfp_base64": "..."
	}
}
```

## Responses

### Error Responses

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`
* `{"error": "Invalid or expired session"}`

**Code:** `500 Internal Server Error`
* `{"error": "Invalid or expired session"}`
