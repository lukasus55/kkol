# Search Players
Search for player by querry.

* **URL:** `/api/players`
* **Method:** `GET`
* **Required Roles:** none

---

## Query Parameters

| Parameter | Type | Required | Description |
| :--- | :--- | :---: | :--- |
| `q` | String | Partially* | Search by querry (either player ID or player Name). |

> Note 'q' parameter is not strictly required but the api will return empty object until 'q' length is >1 (at least 2).

### Example Requests

```http
GET /api/search_players?q=harco
```

---

## Detailed Explanation
The player search functionality utilizes PostgreSQL's pg_trgm extension to provide a highly tolerant, typo-friendly search experience. Rather than relying strictly on exact character matches, the query calculates string similarity to deliver the most relevant results.

The search engine operates on three core mechanisms:

**Fuzzy Matching (Trigram Similarity):** By utilizing the % operator, the database breaks strings down into 3-letter chunks (trigrams). This allows the engine to mathematically recognize typos and partial matches—for example, understanding that the query "harboldino" is a high-confidence match for the username "Harnoldihno".

**Exact Substring Fallback:** A standard ILIKE wildcard search is included alongside the fuzzy match. This acts as a safety net, ensuring that very short or exact partial queries are still captured even if the trigram algorithm scores them lower.

**Intelligent Ranking:** Results are dynamically sorted using ORDER BY GREATEST(). The engine evaluates the similarity score against both the player's id and their displayed_name, taking the highest score of the two to guarantee the most accurate matches appear at the very top of the dropdown.

---

## Responses

### Success Response
**Code:** `200 OK`

```json
[
	{
		"id": "harnas",
		"displayed_name": "Harnoldihno",
		"pfp_base64": "..."
	}
]
```

### Error Responses

**Code:** `405 Method not allowed.`
* `{"error": "Method not allowed."}`

**Code:** `500 Internal Server Error`
* `{"error": "Failed to search players."}`
