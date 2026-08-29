import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player, Tournament, TournamentOrganizer } from '../../types/db';
import sql from '../../db.js';
import jwt from 'jsonwebtoken';
import { uuidv7 } from "uuidv7";
import { parse } from 'cookie';
import { escapeHTML } from '../../public/js/utils/helpers.js';

interface PollCreateRequest extends NextApiRequest {
    body: {
        tournament_id: string;
        name: string;
    };
}

export default async function handler(request: PollCreateRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const cookies = parse(request.headers.cookie || '');
        const token = cookies.auth_token;

        if (!token) return response.status(401).json({ error: "Brak autoryzacji." });

        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET as string) as Pick<Player, 'id'> & { role?: string };
        const requesterId = decodedPayload.id;

        const { tournament_id, name } = request.body;

        if (!tournament_id || !name) {
            return response.status(400).json({ error: "Brakujące dane (Nazwa lub Id turnieju)." });
        }

        const clean_name = escapeHTML(name);
        
        if (clean_name.trim().length < 3) {
            return response.status(400).json({ error: "Nazwa ankiety musi mieć co najmniej 3 znaki." });
        }
        
        if (clean_name.trim().length > 70) {
            return response.status(400).json({ error: "Nazwa ankiety może mieć maksymalnie 70 znaków." });
        }

        const tournamentCheck = await sql<Pick<Tournament, 'finished'>[]>`
            SELECT finished FROM tournaments WHERE id = ${tournament_id}
        `;

        if (tournamentCheck.length === 0) {
            return response.status(400).json({ error: "Nie możesz dodać ankiety do turnieju, który nie istnieje." });
        }

        if (tournamentCheck[0].finished === true) {
            return response.status(400).json({ error: "Nie możesz dodać ankiety do zakończonego turnieju." });
        }

        const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
            sql<Pick<Player, 'role'>[]>`SELECT role FROM players WHERE id = ${requesterId}`,
            sql<Pick<TournamentOrganizer, 'role'>[]>`SELECT role FROM tournament_organizers WHERE tournament_id = ${tournament_id} AND player_id = ${requesterId}`
        ]);

        const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

        let hasPermission = false;
        
        if (globalRole === 'admin') {
            hasPermission = true;
        } else if (tournamentRoleCheck.length > 0) {
            const tournamentRole = tournamentRoleCheck[0].role;
            if (tournamentRole && ['owner', 'manager'].includes(tournamentRole)) {
                hasPermission = true;
            }
        }

        if (!hasPermission) {
            return response.status(403).json({ error: "Brak uprawnień. Musisz być administratorem lub zarządcą tego turnieju." });
        }

        const id = uuidv7()

        await sql`
            INSERT INTO polls (id, tournament_id, creator_id, name)
            VALUES (${id}, ${tournament_id}, ${requesterId}, ${clean_name})
        `;

        return response.status(200).json({ success: true, id: id });

    } catch (error: any) {
        console.error("Create Poll Error:", error);
        if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
            return response.status(401).json({ error: "Sesja wygasła. Zaloguj się ponownie." });
        }
        return response.status(500).json({ error: "Wystąpił błąd podczas tworzenia wydarzenia." });
    }
}