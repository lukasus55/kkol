import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcrypt';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);
        
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

        // TODO: Generate a session cookie or JWT token here so the user stays logged in

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