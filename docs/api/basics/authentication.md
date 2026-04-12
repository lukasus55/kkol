# Authentication & Authorization

The KKOL API uses **JSON Web Tokens (JWT)** delivered via **HTTP-only Cookies** to handle user sessions and secure protected routes.

---

## The `auth_token` Cookie
Because this API is designed to work seamlessly with a web browser frontend, you do not need to manually attach `Bearer` tokens to your request headers. 

When a user successfully logs in, the server responds with a `Set-Cookie` header containing the JWT. The cookie is explicitly named `auth_token`. The browser (or API testing tools like Insomnia) will automatically attach this cookie to all subsequent API requests.

* **Token Lifespan:** 2 Hours.
* **Security:** HTTP-only (cannot be accessed via frontend JavaScript, protecting against XSS attacks).

---

## Roles & Permissions Matrix
The application implements a dual-layer permission system. A user has a **Global Role** across the entire application, and can optionally hold **Tournament Roles** scoped to individual tournaments.

### Global Roles (Table: `players`)
* `admin`: Has absolute access. Can bypass tournament-specific restrictions to create, edit, or delete any event or tournament.
* `user`: The default role. Cannot modify system data unless explicitly granted a Tournament Role.

### Tournament Roles (Table: `tournament_organizers`)
These roles are scoped *strictly* to the `tournament_id` they are assigned to.
* `owner`: Full administrative control over the specific tournament.
* `manager`: Can manage events, dates, and settings within the tournament.

*(Note: When an API endpoint checks permissions, it verifies if the user is a global `admin` OR if their specific `player_id` holds the required role for the requested `tournament_id`.)*

---

## Standard Authentication Errors
If an endpoint requires authentication, the API evaluates the request before executing any database logic. Failure to meet the security requirements will result in one of the following standard HTTP errors.

### 401 Unauthorized (Authentication Failed)
**Missing Token:** Returned when the `auth_token` cookie is entirely absent from the request headers.
```json
{ 
  "error": "Brak autoryzacji.",
}
```

**Expired Token:** Returned when the token exists but the 2-hour lifespan has elapsed. 
> Note: Some old API endpoint return `Missing Token` error instead. This will be fixed in the future.
```json
{ 
  "error": "Brak autoryzacji.",
}
```

### 403 Forbidden (Authorization Failed)
**Insufficient Role:** Returned when the user has a valid, unexpired token, but their Global or Tournament Role does not grant them permission to perform the requested action.
```json
{ 
  "error": "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." 
}
```