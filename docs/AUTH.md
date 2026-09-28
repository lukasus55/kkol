# Dokumentacja Systemu Autoryzacji KKOL & Integracji Ekosystemu

Ten dokument opisuje architekturę systemu logowania i sesji w projekcie KKOL oraz instrukcję integracji dla innych aplikacji ekosystemu (np. gra KKOL, zewnętrzne panele).

---

## 1. Architektura i Założenia

System autoryzacji KKOL opiera się na **sesjach po stronie serwera (Server-side Sessions)** z hashowaniem tokenów:

1. **Brak otwartej rejestracji:** Konta użytkowników (`players`) są tworzone wyłącznie przez administratora.
2. **Session-backed JWT (Wsteczna kompatybilność i sesja serwerowa):** Token w ciasteczku jest podpisany przez serwer i zawiera `{ id, role, sessionId }`. Dzięki temu istniejące endpointy korzystające z `jwt.verify` nie ulegają awarii, a zmigrowane endpointy weryfikują unikalne `sessionId` bezpośrednio w tabeli PostgreSQL `sessions`.
3. **Bezpieczeństwo bazy danych (SHA-256):** Do bazy danych trafia hash tokena (`token_hash`), co uniemożliwia kradzież sesji w razie wycieku bazy.
4. **Natychmiastowe unieważnianie:** Usunięcie rekordu sesji z tabeli `sessions` natychmiast odrzuca żądania w `/api/me` i na wszystkich podstronach, wylogowując użytkownika.
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
    ip_address VARCHAR(45),                     -- IPv4 lub IPv6
    user_agent TEXT,                            -- Pełny nagłówek User-Agent
    device_info VARCHAR(100),                   -- Np. "Chrome (Windows)", "Safari (iOS)"
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

Kluczowe funkcje dostępne w projekcie:

* `createSession(playerId, req, options?)` – tworzy sesję w bazie, zwraca surowy token i obiekt sesji.
* `verifySession(req)` – odczytuje token z ciasteczka lub nagłówka `Authorization: Bearer <token>`, sprawdza w bazie ważność i aktywność konta (`is_active`). Aktualizuje `last_active_at` (throttled co 5 min).
* `revokeSession(sessionId, playerId?)` – usuwa sesję z bazy danych.
* `revokeAllUserSessions(playerId, exceptSessionId?)` – wylogowuje wszystkie pozostałe urządzenia poza bieżącym.
* `setSessionCookie(res, token, expiresAt)` – ustawia ciasteczko `HttpOnly; SameSite=Lax; Path=/`.
* `clearSessionCookie(res)` – czyści ciasteczko autoryzacyjne.

---

## 4. Jak podpiąć nową aplikację z ekosystemu (SSO Guide)

Planujesz stworzyć nową aplikację (np. grę KKOL, osobną stronę z inną bazą danych lub inną technologią)? Oto jak zintegrować ją z autoryzacją KKOL:

### Scenariusz A: Zewnętrzna aplikacja z osobną bazą danych (Rekomendowany)

Aplikacja zewnętrzna nie ma bezpośredniego dostępu do bazy użytkowników KKOL, ale ufa KKOL jako dostawcy tożsamości.

#### Krok 1: Przekierowanie do logowania
Gdy użytkownik wejdzie na zewnętrzną aplikację i nie jest zalogowany, aplikacja przekierowuje go na stronę logowania KKOL:
```
https://kkol.twojadomena.pl/login?redirect_uri=https://gra.twojadomena.pl/auth/callback&app_id=kkol_game
```

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
Odpowiedź KKOL (jeśli token poprawny i aktywny):
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
    "id": "018f...",
    "app_id": "kkol_game",
    "expires_at": "2026-10-28T14:00:00.000Z"
  }
}
```
Twoja zewnętrzna aplikacja może teraz zapisać ten token w swoim lokalnym ciasteczku sesyjnym lub utworzyć lokalną sesję.

#### Krok 4: Zdalne unieważnienie
Gdy użytkownik w KKOL kliknie „Wyloguj ze wszystkich urządzeń” lub wyloguje daną sesję, sesja znika z bazy KKOL. Następne zapytanie Twojej gry do `/api/auth/verify` zwróci `401 Unauthorized`.

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

## 5. Przyszłe Rozszerzenia (Krok 3-5)
* Endpoint `/api/account/sessions` do zarządzania urządzeniami w panelu użytkownika.
* Endpoint `/api/auth/verify` dedykowany dla systemów zewnętrznych.
* Możliwość definiowania uprawnień per aplikacja (`app_id`).
