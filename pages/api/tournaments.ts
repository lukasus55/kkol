import type { NextApiRequest, NextApiResponse } from 'next';
import type { Tournament, Result } from '../../types/db';
import sql from '../../db.js';

interface TournamentsRequest extends NextApiRequest {
    query: {
        id?: string;
        player?: string;
        limit?: string;
    };
}

type TournamentResultRow = Pick<Result, 'tournament_id' | 'player_id' | 'attended' | 'finished' | 'position' | 'total_points'> & {
    player_name: string;
};

export default async function handler(request: TournamentsRequest, response: NextApiResponse) {
    try {
        const { id, player, limit } = request.query;
        const actualLimit = limit ? Math.min(Number(limit), 100) : 100;

        let tournaments: Tournament[];
        let results: TournamentResultRow[];

        if (id) {
            [tournaments, results] = await Promise.all([
                sql<Tournament[]>`SELECT * FROM tournaments WHERE id = ${id} ORDER BY "end_date" DESC`,
                sql<TournamentResultRow[]>`
                    SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name 
                    FROM results r
                    INNER JOIN players p ON r.player_id = p.id 
                    WHERE tournament_id = ${id}`
            ]);
        } 
        else if (player) {
            [tournaments, results] = await Promise.all([
                sql<Tournament[]>`
                    SELECT t.id, t.displayed_name, t.page_exists, t.page_url, t.finished, t.end_date, t.displayed_date, t.tier, r.player_id as __player_id 
                    FROM tournaments t 
                    INNER JOIN results r ON r.tournament_id = t.id  
                    WHERE r.player_id = ${player}
                    ORDER BY "end_date" DESC`,
                sql<TournamentResultRow[]>`
                    SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name 
                    FROM results r
                    INNER JOIN players p ON r.player_id = p.id
                    WHERE player_id = ${player}`
            ]);
        }
        else {
            [tournaments, results] = await Promise.all([
                sql<Tournament[]>`SELECT * FROM tournaments ORDER BY "end_date" DESC LIMIT ${actualLimit}`,
                sql<TournamentResultRow[]>`
                    SELECT r.tournament_id, r.player_id, r.attended, r.finished, r."position", r.total_points, p.displayed_name AS player_name 
                    FROM results r
                    INNER JOIN players p ON r.player_id = p.id 
                    LIMIT ${actualLimit}`
            ]);
        }

        const dataMap: Record<string, any> = {};

        tournaments.forEach((t) => {
            dataMap[t.id] = {
                id: t.id,
                displayed_name: t.displayed_name,
                page_exists: t.page_exists,
                page_url: t.page_url,
                finished: t.finished,
                standings: [],
                details: {
                    end_date: t.end_date,
                    displayed_date: t.displayed_date,
                    players: (t as any).player_count,
                    tier: t.tier
                }
            };
        });

        results.forEach((r) => {
            const tournament = dataMap[r.tournament_id];

            if (tournament && r.attended) {
                tournament.standings.push({
                    id: r.player_id,
                    displayed_name: r.player_name,
                    position: r.position || '-',
                    total_points: r.total_points || 0
                });
            }
        });

        Object.values(dataMap).forEach((tournament: any) => {
            tournament.standings.sort((a: any, b: any) => {
                if (a.position !== b.position) {
                    if (a.position === '-') return 1;
                    if (b.position === '-') return -1;
                    return a.position - b.position;
                }
                return a.id.localeCompare(b.id);
            });
        });

        return response.status(200).json(dataMap);

    } catch (error: any) {
        console.error("Tournament API Error:", error);
        return response.status(500).json({ error: "Failed to load tournaments" });
    }
}
