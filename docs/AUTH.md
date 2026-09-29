# Dokumentacja Systemu Autoryzacji KKOL & Integracji Ekosystemu

Ten dokument opisuje architekturę systemu logowania i sesji w projekcie KKOL oraz instrukcję integracji dla innych aplikacji ekosystemu (np. gra KKOL, zewnętrzne panele).

---

## 1. Architektura i Założenia

System autoryzacji KKOL opiera się na **sesjach po stronie serwera (Server-side Sessions)** z hashowaniem tokenów:

1. **Brak otwartej rejestracji:** Konta użytkowników (`players`) są tworzone wyłącznie przez administratora.
2. **Session-backed JWT (Weryfikacja serwerowa w bazie):** Token w ciasteczku jest podpisany przez serwer i zawiera `{ id, role, sessionId }`. Wszystkie endpointy w aplikacji korzystają z `verifySession(request)`, sprawdzając stan rekordu w tabeli PostgreSQL `sessions`.
3. **Bezpieczeństwo bazy danych (SHA-256):** Do bazy danych trafia skrót tokena (`token_hash`), co uniemożliwia kradzież sesji w razie wycieku bazy.
4. **Natychmiastowe unieważnianie:** Usunięcie rekordu sesji z tabeli `sessions` (np. zdalnie z innego urządzenia) natychmiast blokuje dostęp we wszystkich endpointach API i w `/api/me`.
5. **Dwa kanały autoryzacji:**
   - Ciasteczko HTTP-Only `auth_token` (dla przeglądarek).
   - Nagłówek `Authorization: Bearer <token>` (dla innych aplikacji w ekosystemie).

---

## 2. Schemat Bazy Danych

Tabela `sessions` w bazie PostgreSQL:

```sql
CREATE TABLE IF NOT EXISTS sessions (
    id VARCHAR(36) PRIMARY KEY,                  -- Identyfikator UUIDv7 sesji
    player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,     -- SHA-256 skrót tokena
    ip_address VARCHAR(45),                     -- IPv4 lub IPv6 (oczyszczone z ::ffff:)
    user_agent TEXT,                            -- Pełny nagłówek User-Agent
    device_info VARCHAR(100),                   -- Np. "Firefox (Windows)", "Safari (iOS)"
    app_id VARCHAR(50) DEFAULT 'kkol_main',     -- Identyfikator aplikacji ekosystemu
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL             -- Domyślnie 30 dni od utworzenia
);

CREATE INDEX IF NOT EXISTS idx_sessions_player_id ON sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
```

---

## 3. Moduł `lib/auth.ts` (API Wewnętrzne)

Główne funkcje modułu autoryzacji:

* `createSession(playerId, req, options?)` – tworzy sesję w bazie, zwraca surowy token JWT oraz obiekt sesji.
* `verifySession(req)` – weryfikuje token z ciasteczka lub nagłówka `Authorization: Bearer <token>`, sprawdza w bazie ważność sesji i aktywność konta (`is_active`). Aktualizuje `last_active_at` (throttled co 5 minut).
* `revokeSession(sessionId, playerId?)` – unieważnia i usuwa wskazaną sesję z bazy danych.
* `revokeAllUserSessions(playerId, exceptSessionId?)` – unieważnia wszystkie sesje gracza, z opcjonalnym zachowaniem bieżącej sesji.
* `getClientIp(req)` – wyciąga adres IP klienta z nagłówków (`x-forwarded-for`) lub socketu, automatycznie usuwając prefiks `::ffff:`.
* `parseDeviceInfo(userAgent)` – mapuje ciąg User-Agent na czytelną nazwę przeglądarki i systemu operacyjnego (np. `Firefox (Windows)`).
* `setSessionCookie(res, token, expiresAt)` – ustawia ciasteczko `HttpOnly; SameSite=Lax; Path=/`.
* `clearSessionCookie(res)` – czyści ciasteczko sesyjne.

---

## 4. Dostępne Endpointy API Sesji i Autoryzacji

Wszystkie poniższe endpointy są w pełni zaimplementowane, udokumentowane w Swaggerze (`/api-docs`) i objęte testami jednostkowymi:

### 1. `GET /api/sessions`
* **Opis:** Zwraca listę aktywnych sesji zalogowanego użytkownika.
* **Autoryzacja:** Ciasteczko `auth_token` lub `Authorization: Bearer <token>`.
* **Przykładowa odpowiedź:**
```json
{
  "sessions": [
    {
      "id": "01923a1b-...",
      "player_id": "jan_kowalski",
      "ip_address": "127.0.0.1",
      "device_info": "Firefox (Windows)",
      "app_id": "kkol_main",
      "created_at": "2026-09-28T15:00:00.000Z",
      "last_active_at": "2026-09-28T17:34:00.000Z",
      "expires_at": "2026-10-28T15:00:00.000Z",
      "is_current": true
    }
  ]
}
```

### 2. `DELETE /api/sessions`
* **Opis:** Unieważnia wybraną sesję lub wszystkie pozostałe urządzenia.
* **Parametry:**
  - `?id=<session_id>` – unieważnia konkretną sesję (jeśli unieważniana jest bieżąca sesja, czyści również ciasteczko).
  - `?others=true` – unieważnia wszystkie sesje gracza poza bieżącą.
* **Przykładowa odpowiedź:**
```json
{
  "success": true,
  "message": "Sesja została unieważniona."
}
```

### 3. `GET /api/auth/verify`
* **Opis:** Dedykowany endpoint dla zewnętrznych aplikacji ekosystemu do walidacji tokenu i pobrania tożsamości użytkownika.
* **Nagłówek:** `Authorization: Bearer <raw_session_token>`.
* **Odpowiedź (200 OK):**
```json
{
  "valid": true,
  "user": {
    "id": "jan_kowalski",
    "role": "player",
    "displayed_name": "Jan Kowalski",
    "is_active": true
  },
  "session": {
    "id": "01923a1b-...",
    "app_id": "kkol_game",
    "expires_at": "2026-10-28T15:00:00.000Z"
  }
}
```
* **Odpowiedź (401 Unauthorized):**
```json
{
  "valid": false,
  "error": "Invalid or expired session"
}
```

### 4. `POST /api/auth/authorize`
* **Opis:** Umożliwia natychmiastowe wydanie tokenu sesji dla zewnętrznej aplikacji ekosystemu (`app_id`) dla użytkownika, który jest już zalogowany w KKOL (np. flow "Kontynuuj jako Jan Kowalski" na `/login?redirect_uri=...`).
* **Autoryzacja:** Ciasteczko `auth_token` lub `Authorization: Bearer <token>`.
* **Ciało żądania:**
```json
{
  "appId": "kkol_game"
}
```
* **Odpowiedź (200 OK):**
```json
{
  "token": "<raw_session_token>",
  "user": {
    "id": "jan_kowalski",
    "role": "player",
    "displayed_name": "Jan Kowalski"
  }
}
```

### 5. `POST /api/login` & `POST /api/logout`
* `/api/login` weryfikuje hasło, tworzy wpis w `sessions` z metadanymi urządzenia i `appId` (domyślnie `kkol_main`), ustawia ciasteczko `HttpOnly` oraz zwraca obiekt z surowym `token` w JSON (`{ message, token, user }`), co umożliwia bezpośrednie przekierowanie do `redirect_uri` w flow SSO.
* `/api/logout` usuwa wpis sesji z bazy danych i czyści ciasteczko.

---

## 5. Jak podpiąć nową aplikację z ekosystemu (SSO Guide)

Planujesz stworzyć nową aplikację (np. grę KKOL, osobną stronę z inną bazą danych lub inną technologią)? Oto jak zintegrować ją z autoryzacją KKOL:

### Scenariusz A: Zewnętrzna aplikacja z osobną bazą danych (Rekomendowany)

Aplikacja zewnętrzna nie ma bezpośredniego dostępu do bazy użytkowników KKOL, ale ufa KKOL jako dostawcy tożsamości.

#### Krok 1: Przekierowanie do logowania
Gdy użytkownik wejdzie na zewnętrzną aplikację i nie jest zalogowany, aplikacja przekierowuje go na dedykowaną stronę logowania KKOL:
```
https://kkol.twojadomena.pl/login?redirect_uri=https://gra.twojadomena.pl/auth/callback&app_id=kkol_game
```
* **Dedykowany layout bez głównego paska nawigacji:** Strona `/login` renderuje się autonomicznie (bez wewnętrznego navbara KKOL), wyświetla oficjalne logo Karwińskiej Olimpiady oraz dedykowany kafelek z informacją: *"Logujesz się do: kkol_game (gra.twojadomena.pl)"*.
* **Automatyczne rozpoznawanie aktywnej sesji:** Jeśli użytkownik jest już zalogowany w przeglądarce, zamiast ponownego wpisywania hasła otrzymuje prompt: *"Zalogowano jako: Jan Kowalski"* z przyciskiem szybkiego przejścia (*"Kontynuuj jako Jan"*) lub możliwością zmiany konta.

#### Krok 2: Po zalogowaniu w KKOL
KKOL generuje sesję z parametrem `app_id = 'kkol_game'` i przekierowuje użytkownika z powrotem:
```
https://gra.twojadomena.pl/auth/callback?token=<raw_session_token>
```

#### Krok 3: Weryfikacja tokena przez Twoją aplikację
Twoja zewnętrzna aplikacja weryfikuje token, odpytując endpoint KKOL:
```http
GET https://kkol.twojadomena.pl/api/auth/verify
Authorization: Bearer <raw_session_token>
```
Odpowiedź KKOL zawiera dane użytkownika oraz sesji. Twoja zewnętrzna aplikacja może zapisać ten token w swoim lokalnym ciasteczku sesyjnym lub utworzyć lokalną sesję.

#### Krok 4: Zdalne unieważnienie
Gdy użytkownik w KKOL kliknie „Wyloguj ze wszystkich urządzeń” lub wyloguje sesję danej aplikacji, sesja znika z bazy KKOL. Każde kolejne zapytanie gry do `/api/auth/verify` zwróci `401 Unauthorized`.

---

### Scenariusz B: Wspólna baza danych
Jeśli nowa aplikacja ma bezpośrednie połączenie z tą samą bazą PostgreSQL:
* Wystarczy przekazać token w ciasteczku lub nagłówku.
* Nowa aplikacja oblicza `sha256(token)` i sprawdza zapytaniem:
```sql
SELECT s.*, p.displayed_name, p.role, p.is_active 
FROM sessions s
JOIN players p ON s.player_id = p.id
WHERE s.token_hash = $1 AND s.expires_at > CURRENT_TIMESTAMP;
```

---

## 6. Możliwe Przyszłe Usprawnienia
* Definiowanie szczegółowych uprawnień/zakresów (scopes) per `app_id`.
* Cron job czyszczący wygasłe rekordy sesji starsze niż `expires_at`.
* Powiadomienia w interfejsie lub logowanie historii logowań (audit log).
