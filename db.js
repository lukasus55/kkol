import postgres from 'postgres';

// This runs ONCE when the server starts, creating a single reusable pool
const sql = postgres(process.env.DATABASE_URL);

export default sql;