import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

interface TournamentToggleAttendanceRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        target_player_id: string;
    };
}

export default async function handler(request: TournamentToggleAttendanceRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, target_player_id } = request.body;

        if (!tournament_id || !target_player_id) {
            return response.status(400).json({ error: "Invalid payload" });
        }

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || !['owner', 'manager'].includes(authCheck[0].role)) {
            return response.status(403).json({ error: "Brak uprawnień do edycji tego turnieju." });
        }

        await sql`
            UPDATE results 
            SET attended = NOT attended 
            WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id}
        `;

        return response.status(200).json({ message: "Status obecności został zmieniony." });

    } catch (error: any) {
        console.error("Toggle Attendance Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany statusu obecności." });
    }
}