import { serialize } from 'cookie';

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: "Method not allowed" });
    }

    try {
        // Create a "dead" cookie by setting the maxAge to -1 and value to an empty string
        const cookieHeader = serialize('auth_token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: -1, // tells the browser to instantly delete the cookie
            path: '/'
        });

        response.setHeader('Set-Cookie', cookieHeader);

        return response.status(200).json({ message: "Logged out successfully" });

    } catch (error) {
        console.error("Logout Error:", error);
        return response.status(500).json({ error: "Internal server error during logout" });
    }
}