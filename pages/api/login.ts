import type { NextApiRequest, NextApiResponse } from 'next';
import type { Player } from '../../types/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie'
import sql from '../../db.js';

interface LoginRequest extends NextApiRequest {
    body: {
        username?: string;
        password?: string;
    };
}

export default async function handler(request: LoginRequest, response: NextApiResponse) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const { username, password } = request.body;

        if (!username || !password) {
            return response.status(400).json({ error: "Username and password are required" });
        }

        const users = await sql<Pick<Player, 'id' | 'password_hash' | 'role' | 'is_active'>[]>`
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

        const passwordsMatch = await bcrypt.compare(password, user.password_hash);

        if (!passwordsMatch) {
            return response.status(401).json({ error: "Invalid username or password" });
        }

        await sql`UPDATE players SET last_login = CURRENT_TIMESTAMP WHERE id = ${user.id}`;

        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET as string,
            { expiresIn: '2h' }
        );

        const cookieHeader = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 2,
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

    } catch (error: any) {
        console.error("Login Error:", error);
        return response.status(500).json({ error: "Internal server error during login" });
    }
}