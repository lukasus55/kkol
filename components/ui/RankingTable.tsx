"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface RankingTableProps {
  tournamentId: string;
  children?: React.ReactNode;
}

export default function RankingTable({ tournamentId, children }: RankingTableProps) {
  const [data, setData] = useState<{ tournament: any; events: any[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      if (!tournamentId) return;
      try {
        const [tRes, eRes] = await Promise.all([
          fetch(`/api/tournaments?id=${tournamentId}`),
          fetch(`/api/event_results?tournament=${tournamentId}&major=true`)
        ]);
        const tData = await tRes.json();
        const eData = await eRes.json();
        setData({ tournament: tData[tournamentId], events: eData });
      } catch (err) {
        console.error("Failed to fetch ranking table data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [tournamentId]);

  if (loading) {
    return (
      <div className="w-full flex justify-center py-8">
        <Loader2 className="w-12 h-12 text-accent-500 animate-spin" />
      </div>
    );
  }

  const standings = data?.tournament?.standings || [];
  const events = data?.events || [];

  return (
    <table className="ranking_table">
      {children}
      <tbody>
        {standings.map((player: any, rowIndex: number) => {
          return (
            <tr key={player.id} className="ranking_table_standard animate-row" style={{ animationDelay: `${rowIndex * 0.1}s` }}>
              <td className="ranking_table_position">{player.position}</td>
              <td className="ranking_player">{player.displayed_name}</td>
              {events.map((event: any, idx: number) => {
                const pEvent = event.results?.find((p: any) => p.player_id === player.id);
                const score = (pEvent?.points === null || pEvent?.points === undefined)
                  ? '-'
                  : Number.parseFloat(pEvent.points).toFixed(0);
                return <td key={idx} className="ranking_game_result">{score}</td>;
              })}
              <td className="ranking_total">{player.total_points}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
