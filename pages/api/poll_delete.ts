import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { hasTournamentPermission } from '../../public/js/utils/permissionChecks.js';

export default async function handler(request: NextApiRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // AUTHENTICATION
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload: any = jwt.verify(token, process.env.JWT_SECRET as string);
        const requesterId = decodedPayload.id;

        const { id } = request.body;

        if (!id) {
            return response.status(400).json({ error: "Brak ID ankiety do usunięcia." });
        }

        // poll validation
        const pollCheck = await sql`
            SELECT tournament_id FROM polls WHERE id = ${id}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz usunać ankiety która nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;

        // tournament validation
        const tournamentCheck = await sql`
            SELECT finished FROM tournaments WHERE id = ${tournamentId}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz edytować ankiety w turnieju, który nie istnieje." });
        }

        const hasPermission = await hasTournamentPermission(requesterId, tournamentId);
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do usunięcia tej ankiety. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        // EXECUTE
        await sql`DELETE FROM polls WHERE id = ${id}`;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Delete Poll Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania wydarzenia." });
    }
}