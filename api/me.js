
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import sql from '../db.js';

export default async function handler(request, response) {

    const cookies = parse(request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return response.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET);
        
        
        const users = await sql`
            SELECT 
                p.id, 
                p.role, 
                p.is_active, 
                p.email, 
                p.displayed_name,
                p.pfp_base64,
                COALESCE(
                    (SELECT json_object_agg(tournament_id, role) 
                    FROM tournament_organizers 
                    WHERE player_id = p.id), 
                    '{}'::json
                ) AS organizer_roles,
                COALESCE(
                    (SELECT json_object_agg(
                        tournament_id, 
                        json_build_object(
                            'id', tournament_id,
                            'attended', attended,
                            'position', position,
                            'total_points', total_points,
                            'games_positions', games_positions,
                            'games_points', games_points
                        )
                    ) 
                    FROM results 
                    WHERE player_id = p.id), 
                    '{}'::json
                ) AS tournaments
            FROM players p
            WHERE p.id = ${decodedPayload.id}
        `;

        const user = users[0];

        if (!user || user.is_active === false) {
            return response.status(401).json({ error: "Account disabled or deleted" });
        }

        return response.status(200).json({ 
            user: {
                id: user.id,
                displayed_name: user.displayed_name,
                role: user.role,
                is_active: user.is_active,
                email: user.email,
                organizer_roles: user.organizer_roles,
                tournaments: user.tournaments,
                pfp_base64: user.pfp_base64
            }
        });

    } catch (error) {
        console.error("Token verification failed:", error.message);
        return response.status(401).json({ error: "Invalid or expired session" });
    }
}