import { neon } from '@neondatabase/serverless';

// Dynamic Routes makes this file be called when using loadData(api/tableName)
export default async (request, response) => {
    const { table } = request.query;

    // SECURITY CHECKS
    const allowedTables = ['players', 'tournaments', 'results'];
    if (!allowedTables.includes(table)) {
        return response.status(400).json({ error: "Invalid table" });
    }

    try {
        const sql = neon(process.env.DATABASE_URL);

        // Build the string manually so the query is "SELECT * FROM tableName" instead of "SELECT * FROM 'tableName'"
        const queryString = "SELECT * FROM " + table;

        // Use of .query() for raw strings bypasses the "tagged template" requirement
        const data = await sql.query(queryString);

        return response.status(200).json(data);

    } catch (error) {
        console.error("Database Error:", error);
        return response.status(500).json({ error: "Failed to fetch data" });
    }
}