import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../db.js';
import { escapeHTML } from '../js/helpers.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) {
            return response.status(401).json({ error: "Not authenticated" });
        }

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decodedPayload.id;

        const { tournament_id, results, tournament_info } = request.body;

        if (!tournament_id || !Array.isArray(results) || !tournament_info) {
            return response.status(400).json({ error: "Brakujące dane do edycji." });
        }

        const clean_displayed_name = escapeHTML(tournament_info.displayed_name.trim()) || '';
        const clean_displayed_date = escapeHTML(tournament_info.displayed_date.trim()) || '';
        
        if (clean_displayed_name && clean_displayed_name.length > 30) {
            return response.status(400).json({ error: "Nazwa turnieju może mieć maksymalnie 30 znaków." });
        }
        
        if (clean_displayed_date && clean_displayed_date.length > 30) {
            return response.status(400).json({ error: "Wyświetlana data turnieju może mieć maksymalnie 30 znaków." });
        }

        // Handle empty strings from datetime-local input
        const finalEndDate = tournament_info.end_date ? tournament_info.end_date : null;

        if (finalEndDate) {
            const parsedDate = new Date(finalEndDate);
            
            if (isNaN(parsedDate.getTime())) {
                return response.status(400).json({ error: "Nieprawidłowy format daty." });
            }

            const maxDate = new Date('2050-01-01T00:00:00');
            if (parsedDate > maxDate) {
                return response.status(400).json({ error: "Data nie może być późniejsza niż 01/01/2050" });
            }
        }

        // verify organizer role
        const authCheck = await sql`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${userId}
        `;

        if (authCheck.length === 0 || (authCheck[0].role !== 'owner' && authCheck[0].role !== 'manager')) {
            return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
        }
        
        await sql`
            UPDATE tournaments 
            SET 
                displayed_name = ${clean_displayed_name},
                finished = ${tournament_info.finished},
                end_date = ${finalEndDate}, 
                displayed_date = ${clean_displayed_date}
            WHERE id = ${tournament_id}
        `;

        const updatePromises = results.map(player => {
            return sql`
                UPDATE results 
                SET 
                    position = ${player.position}, 
                    total_points = ${player.total_points}
                WHERE tournament_id = ${tournament_id} AND player_id = ${player.player_id}
            `;
        });

        await Promise.all(updatePromises);

        return response.status(200).json({ message: "Zapisano zmiany!" });

    } catch (error) {
        console.error("Save Tournament Results Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zapisywania." });
    }
}