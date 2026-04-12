# Delete Tournament
Deletes a tournament, its results, and its organizer assignments.

* **URL:** `/api/delete_tournament`
* **Method:** `POST`
* **Required Roles:** `owner`

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of the tournament to delete. |

### Example Request

```json
{
  "tournament_id": "kol2026_spring"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Turniej został usunięty."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brak ID turnieju."}`

**Code:** `403 Forbidden`
* `{"error": "Tylko właściciel może usunąć turniej."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas usuwania turnieju."}`
