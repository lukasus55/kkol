import sql from '../db.js';

// Wzór na ranking KKOL to suma następujących elementów:
// - S-SCORE (majorRanking): Średnia z 2 ostatnich (w ujęciu globalnym) turniejów S-Tier (15pkt, 10pkt, 5pkt). 
//   Nieobecność na którymś z tych turniejów oznacza 0 punktów wliczanych do średniej (wynik zawsze dzielony przez 2).
// - AB-SCORE (minorRanking): Średnia z 3 ostatnich (w ujęciu globalnym) turniejów A-Tier lub B-Tier (7pkt, 4pkt, 1pkt). 
//   Podobnie jak wyżej, nieobecność to 0 punktów wliczanych do średniej z 3 turniejów.
//
// *Uwaga: Jeśli w historii ligi odbyło się ogółem mniej turniejów z danej kategorii (np. tylko 1 S-Tier), 
// średnia jest liczona tylko z tych, które faktycznie miały miejsce (dzielnik nie zaniża sztucznie punktów).*
//
// W przypadku remisu na danej pozycji w danym turnieju punkty rankingowe za miejsca zajęte ex aequo 
// są sumowane, a następnie dzielone po równo. Kolejne miejsce w klasyfikacji zostaje pominięte o liczbę 
// zawodników biorących udział w remisie.

const TIER_POINTS = {
    S: [15, 10, 5],
    A: [7, 4, 1],
    B: [7, 4, 1]
};

export default async function handler(request, response) {
    try {
        const { id } = request.query;

        const lastSTournaments = await sql`
            SELECT id, tier FROM tournaments 
            WHERE finished = true AND tier = 'S' 
            ORDER BY end_date DESC LIMIT 2
        `;

        const lastABTournaments = await sql`
            SELECT id, tier FROM tournaments 
            WHERE finished = true AND tier IN ('A', 'B') 
            ORDER BY end_date DESC LIMIT 3
        `;

        const relevantTournaments = [...lastSTournaments, ...lastABTournaments];
        const relevantTournamentIds = relevantTournaments.map(t => t.id);

        if (relevantTournamentIds.length === 0) {
            return response.status(200).json([]);
        }

        const results = await sql`
            SELECT t.id "tournament_id", t.tier "tournament_tier", r.player_id, r.position "player_position", p.displayed_name "player_name", p.pfp_base64 "player_pfp_base64"
            FROM tournaments t 
            INNER JOIN results r ON t.id = r.tournament_id
            INNER JOIN players p ON r.player_id = p.id
            WHERE t.id = ANY(${relevantTournamentIds})
        `;

        const tournamentsMap = {};
        for (const row of results) {
            if (!tournamentsMap[row.tournament_id]) {
                tournamentsMap[row.tournament_id] = { tier: row.tournament_tier, players: [] };
            }
            tournamentsMap[row.tournament_id].players.push(row);
        }

        const playerScores = {};

        for (const tId of Object.keys(tournamentsMap)) {
            const tournament = tournamentsMap[tId];
            const pointsTable = TIER_POINTS[tournament.tier] || [];

            const positionGroups = {};
            for (const p of tournament.players) {
                if (!positionGroups[p.player_position]) positionGroups[p.player_position] = [];
                positionGroups[p.player_position].push(p);
            }

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

        leaderboard.sort((a,b) => b.ranking - a.ranking);

        return response.status(200).json(leaderboard);

    } catch (error) {
        console.error("KKOL Ranking Load Error:", error);
        return response.status(500).json({ error: "Failed to load KKOL ranking" });
    }
}