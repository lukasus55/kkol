# Tournament Editor Details
Fetches tournament member and role details for editing.

* **URL:** `/api/tournament_editor_details`
* **Method:** `GET`
* **Required Roles:** `owner` (tournament-specific) or `manager` (tournament-specific)

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `tournamentId` | String | Yes | Exact ID of the tournament. |

### Example Request

```http
GET /api/tournament_editor_details?tournamentId=kol2026
```

---

## Success Response
**Code:** `200 OK`

```json
{
    "tournament_id": "kol2026",
    "current_user_role": "owner",
    "members": [
        {
            "id": "kostys",
            "displayed_name": "Kostyś",
            "attended": true,
            "position": 1,
            "total_points": 0,
            "games_positions": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "games_points": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "organizer_role": "owner"
        },
        {
            "id": "kukula",
            "displayed_name": "Kukuła",
            "attended": true,
            "position": 1,
            "total_points": 0,
            "games_positions": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "games_points": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "organizer_role": null
        },
        {
            "id": "harnas",
            "displayed_name": "Harnoldihno",
            "attended": true,
            "position": 1,
            "total_points": 0,
            "games_positions": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "games_points": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "organizer_role": "manager"
        },
        {
            "id": "damidami2",
            "displayed_name": "DamiDami2",
            "attended": true,
            "position": 1,
            "total_points": 0,
            "games_positions": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "games_points": [
                "-",
                "-",
                "-",
                "-",
                "-",
                "-"
            ],
            "organizer_role": null
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
