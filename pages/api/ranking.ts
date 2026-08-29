import type { NextApiRequest, NextApiResponse } from 'next';
import type { Tournament } from '../../types/db';
import sql from '../../db.js';

interface RankingRequest extends NextApiRequest {
    query: {
        id?: string;
    };
}

type RankingResultRow = {
    tournament_id: string;
    tournament_tier: string;
    player_id: string;
    player_position: number;
    player_name: string;
    player_pfp_base64: string | null;
};

const TIER_POINTS: Record<string, number[]> = {
    S: [15, 10, 5],
    A: [7, 4, 1],
    B: [7, 4, 1]
};

/**
 * @swagger
 * /api/ranking:
 *   get:
 *     summary: Get KKOL ranking
 *     description: Calculates and returns the official KKOL global ranking based on S-Tier, A-Tier, and B-Tier tournaments.
 *     tags: [Ranking]
 *     parameters:
 *       - in: query
 *         name: id
 *         schema:
 *           type: string
 *         description: Filter ranking for a specific player ID
 *     responses:
 *       200:
 *         description: Ranking leaderboard
 *       500:
 *         description: Internal server error
 */
export default async function handler(request: RankingRequest, response: NextApiResponse) {
    try {
        const { id } = request.query;

        const lastSTournaments = await sql<Pick<Tournament, 'id' | 'tier'>[]>`
            SELECT id, tier FROM tournaments 
            WHERE finished = true AND tier = 'S' 
            ORDER BY end_date DESC LIMIT 2
        `;

        const lastABTournaments = await sql<Pick<Tournament, 'id' | 'tier'>[]>`
            SELECT id, tier FROM tournaments 
            WHERE finished = true AND tier IN ('A', 'B') 
            ORDER BY end_date DESC LIMIT 3
        `;

        const relevantTournaments = [...lastSTournaments, ...lastABTournaments];
        const relevantTournamentIds = relevantTournaments.map(t => t.id);

        if (relevantTournamentIds.length === 0) {
            return response.status(200).json([]);
        }

        const results = await sql<RankingResultRow[]>`
            SELECT t.id "tournament_id", t.tier "tournament_tier", r.player_id, r.position "player_position", p.displayed_name "player_name", p.pfp_base64 "player_pfp_base64"
            FROM tournaments t 
            INNER JOIN results r ON t.id = r.tournament_id
            INNER JOIN players p ON r.player_id = p.id
            WHERE t.id = ANY(${relevantTournamentIds})
        `;

        const tournamentsMap: Record<string, any> = {};
        for (const row of results) {
            if (!tournamentsMap[row.tournament_id]) {
                tournamentsMap[row.tournament_id] = { tier: row.tournament_tier, players: [] };
            }
            tournamentsMap[row.tournament_id].players.push(row);
        }

        const playerScores: Record<string, any> = {};

        for (const tId of Object.keys(tournamentsMap)) {
            const tournament = tournamentsMap[tId];
            const pointsTable = TIER_POINTS[tournament.tier] || [];

            const positionGroups: Record<string, any[]> = {};
            for (const p of tournament.players) {
                if (!positionGroups[p.player_position]) positionGroups[p.player_position] = [];
                positionGroups[p.player_position].push(p);
            }

            for (const [posStr, tiedPlayers] of Object.entries(positionGroups)) {
                const startPosition = parseInt(posStr, 10);
                const tieCount = (tiedPlayers as any[]).length;
                let totalPointsForGroup = 0;

                for (let i = 0; i < tieCount; i++) {
                    const slotIndex = startPosition - 1 + i;
                    if (slotIndex < pointsTable.length) {
                        totalPointsForGroup += pointsTable[slotIndex];
                    }
                }

                const pointsPerPlayer = totalPointsForGroup / tieCount;

                for (const player of tiedPlayers as any[]) {
                    if (!playerScores[player.player_id]) {
                        const player_pfpSrc = player.player_pfp_base64 
                            ? `data:image/webp;base64,${player.player_pfp_base64}` 
                            : '/img/default_pfp.webp';

                        playerScores[player.player_id] = {
                            id: player.player_id,
                            name: player.player_name,
                            pfpSrc: player_pfpSrc,
                            S_PointsTotal: 0,
                            AB_PointsTotal: 0
                        };
                    }

                    if (tournament.tier === 'S') {
                        playerScores[player.player_id].S_PointsTotal += pointsPerPlayer;
                    } else if (tournament.tier === 'A' || tournament.tier === 'B') {
                        playerScores[player.player_id].AB_PointsTotal += pointsPerPlayer;
                    }
                }
            }
        }

        const leaderboard = [];
        
        const sDivisor = Math.max(1, lastSTournaments.length);
        const abDivisor = Math.max(1, lastABTournaments.length);

        for (const pid of Object.keys(playerScores)) {
            if (!id || pid === id) {
                const data = playerScores[pid];
                
                const majorScore = data.S_PointsTotal / sDivisor;
                const minorScore = data.AB_PointsTotal / abDivisor;
                const totalScore = majorScore + minorScore;

                leaderboard.push({
                    id: data.id,
                    name: data.name,
                    pfpSrc: data.pfpSrc,
                    majorRanking: majorScore.toFixed(2),
                    minorRanking: minorScore.toFixed(2),
                    ranking: totalScore.toFixed(2)
                });
            }
        }

        leaderboard.sort((a,b) => parseFloat(b.ranking) - parseFloat(a.ranking));

        return response.status(200).json(leaderboard);

    } catch (error: any) {
        console.error("KKOL Ranking Load Error:", error);
        return response.status(500).json({ error: "Failed to load KKOL ranking" });
    }
}
