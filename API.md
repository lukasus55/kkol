# KKOL API

Welcome to the backend API documentation. 

**Base URLs:**
* Local: `http://localhost:3000`
* Prod: `https://kkol.pl/api`

**Authentication:** All protected routes require a JWT passed via the `auth_token` cookie. [Read more about Authentication here.](./docs/api/basics/authentication.md)

---

## 🗂️ API Directory

### Events
* [**Create Event** (`POST /api/event_create`)](./docs/api/events/event_create.md)
* [**Update Event** (`POST /api/event_update`)](./docs/api/events/event_update.md)
* [**Delete Event** (`POST /api/event_delete`)](./docs/api/events/event_delete.md)

### Tournaments
* [**Get Active Tournaments** (`GET /api/tournament_active`)](./docs/api/tournaments/tournament_active.md)