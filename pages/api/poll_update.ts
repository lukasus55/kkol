import type { NextApiRequest, NextApiResponse } from 'next';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';
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

        const {id, name, start_date, end_date, rights_level} = request.body;

        if (!id || !name || !start_date || !end_date || rights_level === undefined) {
            return response.status(400).json({ error: "Brakujące dane." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa ankiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa ankiety może mieć maksymalnie 70 znaków." });
        }

        // date validation
        const parsedStart = new Date(start_date);
        const minDate = new Date('2024-01-01T00:00:00');
        
        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 500);

        if (isNaN(parsedStart.getTime())) {
            return response.status(400).json({ error: "Nieprawidłowy format daty początkowej." });
        }

        if (parsedStart < minDate || parsedStart > maxDate) {
            return response.status(400).json({ error: "Data wydarzenia musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
        }

        const parsedEnd = new Date(end_date);
        
        if (isNaN(parsedEnd.getTime())) {
            return response.status(400).json({ error: "Nieprawidłowy format daty końcowej." });
        }
        if (parsedEnd < minDate || parsedEnd > maxDate) {
            return response.status(400).json({ error: "Data końcowa musi zawierać się między 2024 rokiem a okresem 500 dni w przód." });
        }
        if (parsedEnd < parsedStart) {
            return response.status(400).json({ error: "Data końcowa nie może być wcześniejsza niż data początkowa." });
        }

        // poll validation
        const pollCheck = await sql`
            SELECT tournament_id FROM polls WHERE id = ${id}
        `;
        
        if (pollCheck.length === 0) {
            return response.status(404).json({ error: "Nie możesz edytować ankiety która nie istnieje." });
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
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą turnieju do którego przypisana jest ta ankieta." });
        }

        // EXECUTE
        const result = await sql`
            UPDATE polls
            SET name = ${clean_name},  
                rights_level = ${rights_level}, 
                start_date = ${start_date},
                end_date = ${end_date}
            WHERE id = ${id}
        `;

        return response.status(200).json({ success: true });

    } catch (error: any) {
        console.error("Update Poll Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}