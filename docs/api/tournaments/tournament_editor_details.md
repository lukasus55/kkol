# Tournament Editor Details
Fetches tournament member and role details for editing.

* **URL:** `/api/tournament_editor_details`
* **Method:** `GET`
* **Required Roles:** `owner` or `manager`

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `tournamentId` | String | Yes | Exact ID of the tournament. |

### Example Request

```http
GET /api/tournament_editor_details?tournamentId=kol2026_spring
```

---

## Success Response
**Code:** `200 OK`

```json
{
  "tournament_id": "kol2026_spring",
  "current_user_role": "manager",
  "members": [
    {
      "id": "damidami2",
      "displayed_name": "Dami",
      "attended": true,
      "position": 1,
      "total_points": 42,
      "games_positions": [1,2],
      "games_points": [21,21],
      "organizer_role": "owner"
    }
  ]
}
```

## Responses

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Tournament ID is required"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do edycji tego turnieju."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to load tournament data"}`
