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
| `tournament_info` | Object | Yes | Tournament display settings, finished state, and event timestamp. |

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

### Full Request Example

```json
{
  "tournament_id": "kol2026_spring",
  "results": [
    {
      "player_id": "damidami2",
      "position": 1,
      "total_points": 12
    },
    {
      "player_id": "kukula",
      "position": 2,
      "total_points": 10
    }
  ],
  "tournament_info": {
    "displayed_name": "SEZON 2026",
    "displayed_date": "15 May 2026",
    "finished": false,
    "timestamp": 1710000000
  }
}
```

> Note: `timestamp` is currently passed as a Unix timestamp integer. This payload will be refactored in the future to use the event time format consistently with events (`TIMESTAMPTZ`) instead of this current integer-based format.

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
