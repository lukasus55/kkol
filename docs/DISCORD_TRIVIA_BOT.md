# Integracja Bota Discord z Ciekawostkami KKOL

Dokumentacja techniczna dla deweloperów opisująca integrację zewnętrznego bota Discord (lub webhooka / cron joba) z modułem ciekawostek KKOL Dashboard.

---

## 1. Architektura i Zasada Działania

Moduł ciekawostek działa w oparciu o model **kolejki FIFO (First In, First Out)** w tabeli PostgreSQL `trivia`:

* **`is_used: false` (W kolejce):** Ciekawostki przygotowane przez administratorów w panelu (`/dashboard/admin/trivia`).
* **`is_used: true`, `used_at: TIMESTAMP` (Opublikowane):** Ciekawostki, które zostały już opublikowane na Discordzie.

### Standardowy cykl publikacji:
1. Bot (np. co tydzień w poniedziałek o określonej godzinie) odpytuje endpoint:  
   `GET /api/admin/trivia?next=true`
2. Serwer zwraca **najstarszą nieużytą ciekawostkę** z kolejki (`ORDER BY id ASC LIMIT 1`).
3. Bot publikuje treść na wybranym kanale Discorda (jako wiadomość lub sformatowany Embed).
4. Po pomyślnym wysłaniu na Discorda bot wywołuje:  
   `PATCH /api/admin/trivia` przekazując `{ "id": trivia.id, "is_used": true }`.
5. Serwer oznacza rekord jako `is_used = true` i zapisuje aktualny znacznik czasu `used_at = NOW()`.

> [!TIP]
> Jeśli wysyłka na Discorda się nie powiedzie (np. błąd API Discorda lub brak połączenia), bot **nie wywołuje** `PATCH`. Dzięki temu ciekawostka nie przepada i pozostaje na początku kolejki do kolejnej próby.

---

## 2. Autoryzacja i Konfiguracja Środowiska

Do autoryzacji bota **nie jest potrzebne konto użytkownika ani sesja w przeglądarce**. Zamiast tego bot korzysta ze stałego klucza API.

### Krok 1: Ustawienie klucza na serwerze KKOL
W pliku `.env.local` na serwerze aplikacji KKOL ustaw zmienną środowiskową:

```env
TRIVIA_API_KEY=twoj_bezpieczny_unikalny_klucz_api_tutaj_12345
```
*(Alternatywnie obsługiwana jest też zmienna `DISCORD_BOT_SECRET`)*

### Krok 2: Nagłówek w żądaniach bota
Bot przekazuje klucz w każdym żądaniu HTTP w jednym z dwóch nagłówków:

```http
x-trivia-api-key: twoj_bezpieczny_unikalny_klucz_api_tutaj_12345
```
lub:
```http
Authorization: Bearer twoj_bezpieczny_unikalny_klucz_api_tutaj_12345
```

---

## 3. Dokumentacja Endpointów API

Adres bazowy: `https://twoja-domena-kkol.pl` (lub `http://localhost:3000` lokalnie).

---

### 3.1. Pobranie następnej ciekawostki z kolejki

Zwraca pojedynczą, najstarszą nieużytą ciekawostkę.

* **Metoda:** `GET`
* **Ścieżka:** `/api/admin/trivia?next=true`
* **Nagłówki:**
  * `x-trivia-api-key: <TRIVIA_API_KEY>`

#### Odpowiedź – ciekawostka dostępna (200 OK):
```json
{
  "trivia": {
    "id": 4,
    "content": "Czy wiesz, że pierwszy turniej KKOL odbył się w 2020 roku i wzięło w nim udział tylko 6 graczy?",
    "is_used": false,
    "used_at": null,
    "created_at": "2026-09-29T17:30:00.000Z",
    "created_by": "admin"
  }
}
```

#### Odpowiedź – kolejka jest pusta (200 OK):
Gdy w bazie nie ma żadnych rekordów z `is_used = false`:
```json
{
  "trivia": null,
  "message": "Kolejka ciekawostek jest pusta."
}
```

---

### 3.2. Oznaczenie ciekawostki jako opublikowanej

Wywoływane przez bota natychmiast po udanym wysłaniu wiadomości na Discordzie.

* **Metoda:** `PATCH`
* **Ścieżka:** `/api/admin/trivia`
* **Nagłówki:**
  * `Content-Type: application/json`
  * `x-trivia-api-key: <TRIVIA_API_KEY>`
* **Body:**
```json
{
  "id": 4,
  "is_used": true
}
```

#### Odpowiedź sukcesu (200 OK):
```json
{
  "message": "Ciekawostka zaktualizowana.",
  "trivia": {
    "id": 4,
    "content": "Czy wiesz, że...",
    "is_used": true,
    "used_at": "2026-09-29T19:55:00.000Z",
    "created_at": "2026-09-29T17:30:00.000Z",
    "created_by": "admin"
  }
}
```

---

### 3.3. Cofnięcie do kolejki (opcjonalne)

Gdyby zaszła potrzeba przywrócenia ciekawostki do kolejki oczekujących:
* **Metoda:** `PATCH`
* **Body:**
```json
{
  "id": 4,
  "is_used": false
}
```

---

## 4. Gotowe Przykłady Implementacji

### Wariant A: Prosty skrypt publikujący przez Discord Webhook (Node.js)

Najprostsza i najbardziej niezawodna metoda. Nie wymaga stawiania bota WebSocket – wystarczy webhook utworzony w ustawieniach kanału na Discordzie oraz uruchomienie skryptu przez `node publish-trivia.js` w cronie serwera.

```javascript
// publish-trivia.js
// Uruchamianie: node publish-trivia.js

const KKOL_API_URL = process.env.KKOL_API_URL || 'http://localhost:3000';
const TRIVIA_API_KEY = process.env.TRIVIA_API_KEY || 'twoj_klucz_api';
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL; // np. https://discord.com/api/webhooks/...

async function publishNextTrivia() {
  if (!DISCORD_WEBHOOK_URL) {
    throw new Error('Brak zdefiniowanego DISCORD_WEBHOOK_URL');
  }

  // 1. Pobierz kolejną ciekawostkę z kolejki KKOL
  const getRes = await fetch(`${KKOL_API_URL}/api/admin/trivia?next=true`, {
    headers: { 'x-trivia-api-key': TRIVIA_API_KEY }
  });

  if (!getRes.ok) {
    const err = await getRes.text();
    throw new Error(`Błąd pobierania ciekawostki [${getRes.status}]: ${err}`);
  }

  const { trivia } = await getRes.json();

  // Sprawdź czy kolejka nie jest pusta
  if (!trivia) {
    console.warn('⚠️ Kolejka ciekawostek jest pusta! Poinformuj administratorów.');
    return;
  }

  console.log(`Pobrano ciekawostkę #${trivia.id}: "${trivia.content}"`);

  // 2. Wyślij sformatowaną wiadomość na Discorda
  const discordRes = await fetch(DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [
        {
          title: '✨ Ciekawostka Tygodnia KKOL',
          description: trivia.content,
          color: 0xf59e0b, // Amber / złoty kolor KKOL
          footer: {
            text: `Karwińska Olimpiada • Ciekawostka #${trivia.id}`
          },
          timestamp: new Date().toISOString()
        }
      ]
    })
  });

  if (!discordRes.ok) {
    const err = await discordRes.text();
    throw new Error(`Błąd wysyłania na Discord [${discordRes.status}]: ${err}`);
  }

  console.log('✅ Opublikowano na Discordzie!');

  // 3. Oznacz ciekawostkę jako wysłaną w KKOL
  const patchRes = await fetch(`${KKOL_API_URL}/api/admin/trivia`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'x-trivia-api-key': TRIVIA_API_KEY
    },
    body: JSON.stringify({
      id: trivia.id,
      is_used: true
    })
  });

  if (!patchRes.ok) {
    const err = await patchRes.text();
    throw new Error(`Błąd oznaczania statusu w KKOL [${patchRes.status}]: ${err}`);
  }

  console.log(`✅ Ciekawostka #${trivia.id} oznaczona jako opublikowana.`);
}

publishNextTrivia().catch(console.error);
```

---

### Wariant B: Skrypt w Pythonie (do crona lub bota pythonowego)

```python
import os
import requests

KKOL_API_URL = os.getenv("KKOL_API_URL", "http://localhost:3000")
TRIVIA_API_KEY = os.getenv("TRIVIA_API_KEY", "twoj_klucz_api")
DISCORD_WEBHOOK_URL = os.getenv("DISCORD_WEBHOOK_URL")

def publish_trivia():
    headers = {"x-trivia-api-key": TRIVIA_API_KEY}
    
    # 1. Pobierz następną ciekawostkę
    res = requests.get(f"{KKOL_API_URL}/api/admin/trivia?next=true", headers=headers)
    res.raise_for_status()
    data = res.json()
    trivia = data.get("trivia")
    
    if not trivia:
        print("⚠️ Brak ciekawostek w kolejce!")
        return

    # 2. Wyślij na Discord
    payload = {
        "embeds": [{
            "title": "✨ Ciekawostka Tygodnia KKOL",
            "description": trivia["content"],
            "color": 0xf59e0b,
            "footer": {"text": f"Karwińska Olimpiada • Ciekawostka #{trivia['id']}"}
        }]
    }
    discord_res = requests.post(DISCORD_WEBHOOK_URL, json=payload)
    discord_res.raise_for_status()

    # 3. Oznacz jako zużytą w KKOL
    patch_res = requests.patch(
        f"{KKOL_API_URL}/api/admin/trivia",
        headers=headers,
        json={"id": trivia["id"], "is_used": True}
    )
    patch_res.raise_for_status()
    print(f"✅ Sukces: Opublikowano ciekawostkę #{trivia['id']}")

if __name__ == "__main__":
    publish_trivia()
```

---

### Wariant C: Harmonogram w Cronie (Linux / VPS)

Aby skrypt uruchamiał się automatycznie np. w każdy poniedziałek o godzinie 12:00:

```bash
# Otwórz edytor crona:
crontab -e

# Dodaj wpis (uruchamia skrypt w poniedziałki o 12:00):
0 12 * * 1 /usr/bin/node /home/user/kkol-bot/publish-trivia.js >> /var/log/trivia-bot.log 2>&1
```

---

## 5. Testowanie z konsoli (cURL)

Możesz w każdej chwili przetestować endpointy lokalnie lub ze swojego komputera:

### 1. Pobranie następnej ciekawostki:
```bash
curl -X GET "http://localhost:3000/api/admin/trivia?next=true" \
  -H "x-trivia-api-key: twoj_klucz_api"
```

### 2. Oznaczenie jako wysłana:
```bash
curl -X PATCH "http://localhost:3000/api/admin/trivia" \
  -H "Content-Type: application/json" \
  -H "x-trivia-api-key: twoj_klucz_api" \
  -d '{"id": 1, "is_used": true}'
```
