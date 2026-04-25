import sql from '../db.js';

// The scoring system rules:
// Wzór na ranking KKOL to suma następujących elementów:
// - S-SCORE (majorRanking): Średnia z 2 ostatnich turniejów S-Tier (15pkt, 10pkt, 5pkt)
// - AB-SCORE (minorRanking): Średnia z 3 ostatnich turniejów A-Tier lub B-Tier (7pkt, 4pkt, 1pkt)

// W przypadku remisu na danej pozycji w danym turnieju punkty rankingowe za miejsca zajęte ex aequo są sumowane, a następnie dzielone po równo. Kolejne miejsce w klasyfikacji zostaje pominięte o liczbę zawodników biorących udział w remisie.

const TIER_POINTS = {
    S: [15, 10, 5],
    A: [7, 4, 1],
    B: [7, 4, 1]
};

export default async function handler(request, response) {
    try {
        const { id } = request.query;
        let results;

        if (id) {
            // Grabs the target player AND anyone sharing their exact place (for draw calculations)
            results = await sql`
            SELECT t.id "tournament_id", t.tier "tournament_tier", r.player_id, r.position "player_position", p.displayed_name "player_name", p.pfp_base64 "player_pfpSrc"
            FROM tournaments t 
            INNER JOIN results r ON t.id = r.tournament_id
            INNER JOIN players p ON r.player_id = p.id
            WHERE t.finished = true AND (t.id, r.position) IN (
                SELECT tournament_id, position 
                FROM results 
                WHERE player_id = ${id}
            ) ORDER BY t.id`;
        } else {
            results = await sql`
            SELECT t.id "tournament_id", t.tier "tournament_tier", r.player_id, r.position "player_position", p.displayed_name "player_name", p.pfp_base64 "player_pfp_base64"
            FROM tournaments t 
            INNER JOIN results r ON t.id = r.tournament_id
            INNER JOIN players p ON r.player_id = p.id
            WHERE t.finished = true
            ORDER BY t.id`;
        }

        // Group results by tournament to handle points and potential ties
        const tournamentsMap = {};
        for (const row of results) {
            if (!tournamentsMap[row.tournament_id]) {
                tournamentsMap[row.tournament_id] = { tier: row.tournament_tier, players: [] };
            }
            tournamentsMap[row.tournament_id].players.push(row);
        }

        const playerScores = {};
        const sortedTournamentIds = Object.keys(tournamentsMap).sort();

        for (const tId of sortedTournamentIds) {
            const tournament = tournamentsMap[tId];
            const pointsTable = TIER_POINTS[tournament.tier] || [];

            const positionGroups = {};
            for (const p of tournament.players) {
                if (!positionGroups[p.player_position]) positionGroups[p.player_position] = [];
                positionGroups[p.player_position].push(p);
            }

            // Calculate points for each position group
            for (const [posStr, tiedPlayers] of Object.entries(positionGroups)) {
                const startPosition = parseInt(posStr, 10);
                const tieCount = tiedPlayers.length;
                let totalPointsForGroup = 0;

                for (let i = 0; i < tieCount; i++) {
                    const slotIndex = startPosition - 1 + i;
                    if (slotIndex < pointsTable.length) {
                        totalPointsForGroup += pointsTable[slotIndex];
                    }
                }

                // Divide sum evenly among tied players
                const pointsPerPlayer = totalPointsForGroup / tieCount;

                for (const player of tiedPlayers) {
                    if (!playerScores[player.player_id]) {

                        const player_pfpSrc = player.player_pfp_base64 
                            ? `data:image/webp;base64,${player.player_pfp_base64}` 
                            : '/img/default_pfp.webp';

                        playerScores[player.player_id] = {
                            id: player.player_id,
                            name: player.player_name,
                            pfpSrc: player_pfpSrc,
                            S: [],
                            AB: []
                        };
                    }

                    if (tournament.tier === 'S') {
                        playerScores[player.player_id].S.push(pointsPerPlayer);
                    } else if (tournament.tier === 'A' || tournament.tier === 'B') {
                        playerScores[player.player_id].AB.push(pointsPerPlayer);
                    }
                }
            }
        }

        const leaderboard = {};

        for (const pid of Object.keys(playerScores)) {
            // If an ID was requested, isolate just that player (don't return the players that were fetched because they were needed to calculate tie)
            if (!id || pid === id) {

                const data = playerScores[pid];
                
                // Average of last 2 S-Tier scores
                const lastS = data.S.slice(-2);
                const majorScore = lastS.length > 0 
                    ? lastS.reduce((sum, val) => sum + val, 0) / lastS.length 
                    : 0;

                // Average of last 3 A/B-Tier scores
                const lastAB = data.AB.slice(-3);
                const minorScore = lastAB.length > 0 
                    ? lastAB.reduce((sum, val) => sum + val, 0) / lastAB.length 
                    : 0;

                const totalScore = majorScore + minorScore;

                leaderboard[pid] = {
                    id: data.id,
                    name: data.name,
                    pfpSrc: data.pfpSrc,
                    majorRanking: majorScore.toFixed(2),
                    minorRanking: minorScore.toFixed(2),
                    ranking: totalScore.toFixed(2)
                };

            }
        }

        const sortedLeaderboard = Object.values(leaderboard).sort((a,b) => b.ranking - a.ranking);

        return response.status(200).json(sortedLeaderboard);

    } catch (error) {
        console.error(error);
        return response.status(500).json({ error: "Failed to load KKOL ranking" });
    }
}