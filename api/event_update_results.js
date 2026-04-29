import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // AUTHENTICATION
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const requesterId = decodedPayload.id;

        // PAYLOAD VALIDATION
        const { event_id, results } = request.body || {};

        if (!event_id) {
            return response.status(400).json({ error: "Brak ID wydarzenia." });
        }

        if (!Array.isArray(results)) {
            return response.status(400).json({ error: "Wyniki muszą być przekazane w formie tablicy (array)." });
        }

        // TOURNAMENT & EVENT CHECK
        const eventCheck = await sql`
            SELECT e.tournament_id, t.finished 
            FROM events e
            JOIN tournaments t ON e.tournament_id = t.id
            WHERE e.id = ${event_id}
        `;

        if (eventCheck.length === 0) {
            return response.status(404).json({ error: "Wydarzenie nie istnieje." });
        }

        if (eventCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz edytować wyników w zakończonym turnieju." });
        }

        const eventTournamentId = eventCheck[0].tournament_id;

        // PERMISSION CHECK
        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql`SELECT role FROM players WHERE id = ${requesterId}`,
            sql`SELECT role FROM tournament_organizers WHERE tournament_id = ${eventTournamentId} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';
        let hasPermission = false;

        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheck.length > 0) {
            const tournamentRole = tournamentRoleCheck[0].role;
            if (['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        // sql.begin ensures that if one query fails, everything is rolled back.
        await sql.begin(async (t) => {
            for (const playerResult of results) {
                const { player_id, position, points } = playerResult;

                if (!player_id) continue;

                // Ensure undefined values default to null for the database
                const finalPosition = position !== undefined ? position : null;
                const finalPoints = points !== undefined ? points : null;

                const existingRecord = await t`
                    SELECT 1 FROM event_results 
                    WHERE event_id = ${event_id} AND player_id = ${player_id}
                `;

                if (existingRecord.length > 0) {
                    await t`
                        UPDATE event_results 
                        SET position = ${finalPosition}, points = ${finalPoints}
                        WHERE event_id = ${event_id} AND player_id = ${player_id}
                    `;
                } else {
                    await t`
                        INSERT INTO event_results (event_id, player_id, position, points)
                        VALUES (${event_id}, ${player_id}, ${finalPosition}, ${finalPoints})
                    `;
                }
            }
        });

        return response.status(200).json({ success: true, message: "Wyniki zostały zaktualizowane." });

    } catch (error) {
        console.error("Update Event Results Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania wyników." });
    }
}