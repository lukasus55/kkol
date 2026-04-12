# Update Organizer Role
Promotes or demotes a tournament manager for the authenticated owner.

* **URL:** `/api/update_organizer_role`
* **Method:** `POST`
* **Required Roles:** `owner` (tournament-specific)

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournament_id` | String | Yes | Exact ID of the tournament. |
| `target_player_id` | String | Yes | Player ID to promote or demote. |
| `action` | String | Yes | Either `promote` or `demote`. |

### Example Request

```json
{
  "tournament_id": "kol2026",
  "target_player_id": "kukula",
  "action": "promote"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Uprawnienia zostały zaktualizowane."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Invalid payload"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Tylko właściciel turnieju może zarządzać uprawnieniami."}`

**Code:** `405 Method Not Allowed`
* `{"error": "Method not allowed"}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zmiany uprawnień."}`
