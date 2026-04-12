# Leave Tournament
Allows the logged-in player to leave a tournament.

* **URL:** `/api/leave_tournament`
* **Method:** `POST`
* **Required Roles:** authenticated user

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `tournamentId` | String | Yes | ID of the tournament to leave. |

### Example Request

```json
{
  "tournamentId": "kol2026_spring"
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Successfully left the tournament"
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Tournament ID is required"}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `403 Forbidden`
* `{"error": "Players are not allowed to leave S-Tier tournaments."}`
* `{"error": "The owner cannot leave the tournament. You must delete it instead."}`

**Code:** `404 Not Found`
* `{"error": "Tournament not found"}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to leave tournament"}`
