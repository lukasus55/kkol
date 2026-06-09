import sql from "../../db.js";

export async function getTournamentPermission(pId, tId) {
    if (!pId || !tId) return false; 

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