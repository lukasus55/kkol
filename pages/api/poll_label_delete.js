import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../../public/js/utils/permissionChecks.js';

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

        const { id } = request.body;

        if (!id) {
            return response.status(400).json({ error: "Brakujące dane (Id etykiety)." });
        }

        // poll validation
        const labelCheck = await sql`
            SELECT poll_id FROM poll_labels WHERE id = ${id}
        `;

        if (labelCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz usunąć etykiety która nie istnieje." });
        }

        const pollId = labelCheck[0].poll_id;

        // poll validation
        const pollCheck = await sql`
            SELECT tournament_id, rights_level FROM polls WHERE id = ${pollId}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz usunąć etykiety do ankiety która nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;
        const rightsLevel = pollCheck[0].rights_level;

        const allowedByRules = rightsLevel >= 3 && await isPartOfTournament(requesterId, tournamentId); // Rights level 3 or higher allows everyone who is a part of tournmanet to edit labels

        const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId);
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do usunięcia etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać." });
        }

        // EXECUTE
        const result = await sql`DELETE FROM poll_labels WHERE id = ${id}`;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Delete Label Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas usuwania etykiety." });
    }
}