# Change Tournament Tier
Updates the tier of an existing tournament.

* **URL:** `/api/tournament_change_tier`
* **Method:** `POST`
* **Required Roles:** `admin` (global) or `organizer` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of the tournament to update. |
| `new_tier` | String | Yes | New tier value: `S`, `A`, `B`, or `C`. |

### Example Request

```json
{
  "tournament_id": "kol2026",
  "new_tier": "A"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Tier został pomyślnie zmieniony."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Nieprawidłowe dane."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`
* `{"error": "Użytkownik nie istnieje."}`

**Code:** `403 Forbidden`
* `{"error": "Tylko administrator może przypisać rangę S-Tier."}`
* `{"error": "Tylko administrator może zmienić rangę turnieju o randze S-Tier."}`
* `{"error": "Tylko organizatorzy i administratorzy mogą zmieniać tier."}`
* `{"error": "Brak uprawnień do edycji tego turnieju."}`

**Code:** `404 Not Found`
* `{"error": "Turniej nie został znaleziony."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zmiany tieru."}`
