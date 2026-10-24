'use client';

import React, { useState } from 'react';
import { PlayerSidebar, PlayerStats, PlayerRanking } from '@/components/player/PlayerSidebar';
import { PlayerTournamentsHistory, PlayerTournamentItem } from '@/components/player/PlayerTournamentsHistory';
import PageFooter from '@/components/ui/PageFooter';

interface PlayerProfileClientProps {
  player: PlayerStats;
  tournaments: PlayerTournamentItem[];
  ranking: PlayerRanking;
  globalRankPosition: number | null;
  lastSTierPosition: number | null;
  wonTournamentsByTier: { s: string[]; a: string[]; b: string[]; c: string[] };
}

export function PlayerProfileClient({
  player,
  tournaments,
  ranking,
  globalRankPosition,
  lastSTierPosition,
  wonTournamentsByTier,
}: PlayerProfileClientProps) {
  const [selectedTierFilter, setSelectedTierFilter] = useState<string | null>(null);

  return (
    <>
      <main className="min-h-[calc(100vh-60px)] flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: LoL-Inspired Player Card (4 cols on desktop) */}
          <div className="lg:col-span-4 w-full">
            <PlayerSidebar
              player={player}
              ranking={ranking}
              globalRankPosition={globalRankPosition}
              lastSTierPosition={lastSTierPosition}
              wonTournamentsByTier={wonTournamentsByTier}
              selectedTierFilter={selectedTierFilter}
              onSelectTierFilter={setSelectedTierFilter}
            />
          </div>

          {/* Right Column: Tournament History Panel (8 cols on desktop) */}
          <div className="lg:col-span-8 w-full">
            <PlayerTournamentsHistory
              tournaments={tournaments}
              playerId={player.id}
              selectedTierFilter={selectedTierFilter}
              onClearFilter={() => setSelectedTierFilter(null)}
            />
          </div>
        </div>
      </main>
      <PageFooter />
    </>
  );
}

export default PlayerProfileClient;
