# Update Event Results
Edits player results for a specific event.

* **URL:** `/api/event_update_results`
* **Method:** `POST`
* **Required Roles:** `admin` (global), `owner` (tournament-specific), or `manager` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `event_id` | Integer | Yes | Exact ID of the event to update results for. |
| `results` | Array | Yes | Array of player result objects. |

### Player Result Object

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `player_id` | String | Yes | Player's unique identifier. |
| `position` | Integer | No | Player's position in the event. Use `null` to clear. |
| `points` | Float | No | Player's points for the event. Use `null` to clear. |

### Example Request

```json
{
  "event_id": 42,
  "results": [
    { "player_id": "kukula", "position": null, "points": null },
    { "player_id": "kostys", "position": 1, "points": 78 },
    { "player_id": "harnas", "position": null, "points": null }
  ]
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "success": true,
  "message": "Wyniki zostały zaktualizowane."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brak ID wydarzenia."}`
* `{"error": "Wyniki muszą być przekazane w formie tablicy (array)."}`
* `{"error": "Nie możesz edytować wyników w zakończonym turnieju."}`

**Code:** `401 Unauthorized`
* `{"error": "Brak autoryzacji."}`
* `{"error": "Sesja wygasła. Zaloguj się ponownie."}`

**Code:** `403 Forbidden`
* `{"error": "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju."}`

**Code:** `404 Not Found`
* `{"error": "Wydarzenie nie istnieje."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zapisywania wyników."}`

---

## Behavior

* If a player result already exists for the given `event_id` and `player_id`, it will be **updated**.
* If no result exists for the player, a new record will be **inserted**.
* Setting `position` or `points` to `null` will clear that value in the database.
* The endpoint uses a database transaction - if any update fails, all changes are rolled back.