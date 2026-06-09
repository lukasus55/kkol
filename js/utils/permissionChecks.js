import sql from "../../db.js";

/**
 * Checks if user has permission to edit specific tournament.
 * @param {string} pId - Player id
 * @param {string} tId - Tournament id
 * @returns {boolean} Do user have permission to modify specified tournament.
 */
export async function hasTournamentPermission(pId, tId) {
    if (!pId || !tId) {
        console.error('hasTournamentPermission() params not specified!')
        return;
    }

    const [globalRoleCheck, tournamentRoleCheck] = await Promise.all([
        sql`SELECT role FROM players WHERE id = ${pId}`,
        sql`SELECT role FROM tournament_organizers WHERE tournament_id = ${tId} AND player_id = ${pId}`
    ]);

    const globalRole = globalRoleCheck.length > 0 ? globalRoleCheck[0].role : 'user';

    if (globalRole === 'admin') {
        return true;
    } 
    
    if (tournamentRoleCheck.length > 0) {
        const tournamentRole = tournamentRoleCheck[0].role;
        if (['owner', 'manager'].includes(tournamentRole)) {
            return true;
        }
    }

    return false;
}

/**
 * Checks if user is part of specific tournament. IMPORTANT: User being "a part of" means he is assigned to the tournament not that he has 'attended' set to true in "results" table.
 * @param {string} pId - Player id
 * @param {string} tId - Tournament id
 * @returns {boolean} Is user assigned to specified tournament.
 */
export async function isPartOfTournament(pId, tId) {
    if (!pId || !tId) {
        console.error('isPartOfTournament params not specified!')
        return;
    }

    const isPartOf = await sql`
    SELECT EXISTS (
        SELECT 1 
        FROM results
        WHERE tournament_id = ${tId} AND player_id = ${pId}
    );`

    return isPartOf.exists;
}