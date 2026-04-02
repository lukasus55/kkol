import { neon } from '@neondatabase/serverless';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

export default async function handler(request, response) {

    const cookies = parse(request.headers.cookie || '');
    const token = cookies.auth_token;

    if (!token) {
        return response.status(401).json({ error: "Not authenticated" });
    }

    try {
        const decodedPayload = jwt.verify(token, process.env.JWT_SECRET); // If the token is fake or expired, this line throws an error and jumps to the catch block

        // chek if the user wasn't banned since the token was issued.
        const sql = neon(process.env.DATABASE_URL);
        const users = await sql`SELECT id, role, is_active FROM players WHERE id = ${decodedPayload.id}`;
        const user = users[0];

        if (!user || user.is_active === false) {
            return response.status(401).json({ error: "Account disabled or deleted" });
        }

        return response.status(200).json({ 
            user: {
                id: user.id,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Token verification failed:", error.message);
        return response.status(401).json({ error: "Invalid or expired session" });
    }
}