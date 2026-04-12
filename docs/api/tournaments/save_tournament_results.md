# Save Tournament Results
Saves tournament metadata and player results for a tournament editor.

* **URL:** `/api/save_tournament_results`
* **Method:** `POST`
* **Required Roles:** `owner` (tournament-specific) or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of the tournament. |
| `results` | Array | Yes | Array of player result objects. |
| `tournament_info` | Object | Yes | Tournament display settings and finished state. |

### Result Item Example

```json
{
  "player_id": "damidami2",
  "position": 1,
  "total_points": 12
}
```

### Tournament Info Example

```json
{
  "displayed_name": "SEZON 2026",
  "displayed_date": "15 May 2026",
  "finished": false,
  "timestamp": 1710000000
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Zapisano zmiany!"
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brakujące dane do edycji."}`
* `{"error": "Nazwa turnieju może mieć maksymalnie 30 znaków."}`
* `{"error": "Wyświetlana data turnieju może mieć maksymalnie 30 znaków."}`
* `{"error": "Timestamp nie może odpowiadać dacie starszej niż 01/01/2050"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień do edycji tego turnieju."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zapisywania."}`
