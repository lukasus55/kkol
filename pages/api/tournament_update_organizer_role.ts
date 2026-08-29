import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, TournamentOrganizer } from '../../types/db';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../../db.js';

interface TournamentUpdateOrganizerRoleRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        target_player_id: string;
        action: 'promote' | 'demote';
    };
}

export default async function handler(request: TournamentUpdateOrganizerRoleRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Not authenticated" });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, target_player_id, action } = request.body;

        if (!tournament_id || !target_player_id || !['promote', 'demote'].includes(action)) {
            return response.status(400).json({ error: "Invalid payload" });
        }

        const authCheck = await sql<Pick<TournamentOrganizer, 'role'>[]>`
            SELECT role 
            FROM tournament_organizers 
            WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}
        `;

        if (authCheck.length === 0 || authCheck[0].role !== 'owner') {
            return response.status(403).json({ error: "Tylko właściciel turnieju może zarządzać uprawnieniami." });
        }

        if (action === 'promote') {
            await sql`
                INSERT INTO tournament_organizers (tournament_id, player_id, role)
                VALUES (${tournament_id}, ${target_player_id}, 'manager')
                ON CONFLICT (tournament_id, player_id) DO UPDATE SET role = 'manager'
            `;
        } else if (action === 'demote') {
            await sql`
                DELETE FROM tournament_organizers 
                WHERE tournament_id = ${tournament_id} AND player_id = ${target_player_id} AND role = 'manager'
            `;
        }

        return response.status(200).json({ message: "Uprawnienia zostały zaktualizowane." });

    } catch (error: any) {
        console.error("Role Update Error:", error);
        return response.status(500).json({ error: "Wystąpił błąd podczas zmiany uprawnień." });
    }
}