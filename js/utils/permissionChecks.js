import sql from "../../db.js";

/**
 * Checks if user has permission to edit specific tournament.
 * @param {string} pId - Player id
 * @param {string} tId - Tournament id
 * @returns {boolean} Do user have permission to modify specified tournament.
 */
export async function hasTournamentPermission(pId, tId) {
    if (!pId || !tId) {
        console.warn('hasTournamentPermission() params not specified!')
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