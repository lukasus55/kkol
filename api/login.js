import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie'
import sql from '../db.js';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        
        
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({ error: "Username and password are required" });
        }

        const users = await sql`
            SELECT id, password_hash, role, is_active 
            FROM players 
            WHERE id = ${username}
        `;

        const user = users[0];
        if (!user) {
            return response.status(401).json({ error: "Invalid username or password" }); 
        }

        if (user.is_active === false) {
            return response.status(403).json({ error: "This account has been disabled." });
        }

        // Compare the typed password with the hash in the database
        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordsMatch) {
            return response.status(401).json({ error: "Invalid username or password" });
        }

        await sql`UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        const cookieHeader = serialize('auth_token', token, {
            httpOnly: true, // JavaScript cannot read this, preventing theft
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production, allow HTTP on localhost
            sameSite: 'lax', // maintains 99% of the security of strict but allows the cookie to survive the login redirect
            maxAge: 60 * 60 * 2, // 2 hours
            path: '/'
        });

        response.setHeader('Set-Cookie', cookieHeader);

        return response.status(200).json({ 
            message: "Login successful!",
            user: {
                id: user.id,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        return response.status(500).json({ error: "Internal server error during login" });
    }
}