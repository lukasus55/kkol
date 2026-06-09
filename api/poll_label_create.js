import sql from '../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../js/utils/helpers.js';
import { hasTournamentPermission, isPartOfTournament } from '../js/utils/permissionChecks.js';

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

        const { poll, name, hex, description } = request.body;

        if (!poll || !name || !hex) {
            return response.status(400).json({ error: "Brakujące dane (Nazwa, Hex lub Id ankiety)." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa etykiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 30) {
            return response.status(400).json({ error: "Nazwa etykiety może mieć maksymalnie 30 znaków." });
        }

        const clean_description = escapeHTML(name);
        
        if (clean_description.trim().length > 500) {
            return response.status(400).json({ error: "Opis etykiety może mieć maksymalnie 500 znaków." });
        }

        // poll validation
        const pollCheck = await sql`
            SELECT tournament_id, rights_level FROM polls WHERE id = ${poll}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz dodać etykiety do ankiety która nie istnieje." });
        }
        
        const tournamentId = pollCheck[0].tournament_id;
        const rightsLevel = pollCheck[0].rights_level;

        const allowedByRules =  rightsLevel >= 3 && await isPartOfTournament(requesterId, tournamentId); // Rights level 3 or higher allows everyone who attended tournmanet to edit labels

        const hasPermission = allowedByRules || await hasTournamentPermission(requesterId, tournamentId)
        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień do dodania etykiety. Musisz być administratorem, być zarządcą tego turnieju lub ustawienia tej ankiety muszą ci na to pozwalać." });
        }

        // EXECUTE
        const result = await sql`
            INSERT INTO poll_labels (poll_id, name, hex, description)
            VALUES (${poll}, ${clean_name}, ${hex}, ${description || null})
        `;

        return response.status(200).json({ success: true });

    } catch (error) {
        console.error("Create Poll Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}