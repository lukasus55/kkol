# Upload Profile Picture
Uploads and updates the authenticated user's profile image.

* **URL:** `/api/upload_pfp`
* **Method:** `POST`
* **Required Roles:** authenticated user

---

## Request Payload

| Field | Type | Required | Description / Rules |
| :--- | :--- | :---: | :--- |
| `image_base64` | String | Yes | Base64 image string. Can include the data URI prefix. |

### Example Request

```json
{
  "image_base64": "data:image/png;base64,iVBORw0KGgo..."
}
```

---

## Responses

### Success Response
**Code:** `200 OK`

```json
{
  "message": "Zdjęcie profilowe zaktualizowane."
}
```

### Error Responses

**Code:** `400 Bad Request`
* `{"error": "Brak pliku obrazu."}`

**Code:** `401 Unauthorized`
* `{"error": "Not authenticated"}`

**Code:** `404 Not Found`
* `{"error": "Użytkownik nie istnieje."}`

**Code:** `429 Too Many Requests`
* `{"error": "Musisz odczekać jeszcze Xh Ym przed kolejną zmianą zdjęcia."}`

**Code:** `500 Internal Server Error`
* `{"error": "Wystąpił błąd podczas zapisywania zdjęcia."}`
