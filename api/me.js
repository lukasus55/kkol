import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import fs from 'fs';
import path from 'path';

export default async function handler(request, response) {

    const cookies = parse(request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return response.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET); // If the token is fake or expired, this line throws an error and jumps to the catch block

        const sql = neon(process.env.DATABASE_URL);
        const users = await sql`SELECT id, role, is_active, email, displayed_name FROM players WHERE id = ${decodedPayload.id}`;
        // const users = await sql`SELECT id, role, is_active, email, displayed_name, last_login, position, tournament_id FROM (players JOIN results ON players.id = results.player_id) WHERE id = ${decodedPayload.id}`;
        const user = users[0];

        if (!user || user.is_active === false) {
            return response.status(401).json({ error: "Account disabled or deleted" });
        }

        let pfpPath = `/img/players/pfp/default.webp`;
                        
        const browserUrl = `/img/players/pfp/${user.id}.webp`;

        const serverFilePath = path.join(process.cwd(), 'img', 'players', 'pfp', `${user.id}.webp`);

        if (fs.existsSync(serverFilePath)) { 
            pfpPath = browserUrl; 
        }

        return response.status(200).json({ 
            user: {
                id: user.id,
                displayed_name: user.displayed_name,
                role: user.role,
                is_active: user.is_active,
                tournament_id: user.tournament_id,
                email: user.email,
                pfp_url: pfpPath
            }
        });

    } catch (error) {
        console.error("Token verification failed:", error.message);
        return response.status(401).json({ error: "Invalid or expired session" });
    }
}