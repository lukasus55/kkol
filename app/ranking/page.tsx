'use client';

import React, { useEffect, useState } from 'react';
import { RankingTableCard } from '@/components/ranking/RankingTableCard';
import { RankingExplainer } from '@/components/ranking/RankingExplainer';
import { RankingPlayer } from '@/components/ranking/RankingRow';
import PageFooter from '@/components/ui/PageFooter';

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRankingData() {
      try {
        const res = await fetch('/api/ranking');
        const data = await res.json();

        const list = Array.isArray(data) ? data : Object.values(data || {});

        const sortedLeaderboard = list
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            majorRanking: Number(p.majorRanking) || 0,
            minorRanking: Number(p.minorRanking) || 0,
            ranking: Number(p.ranking) || 0,
            pfpSrc: p.pfpSrc || '/img/default_pfp.webp'
          }))
          .sort((a, b) => b.ranking - a.ranking);

        setLeaderboard(sortedLeaderboard);
      } catch (err) {
        console.error('Failed to load ranking data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadRankingData();
  }, []);

  return (
    <>
      <main className="min-h-[calc(100vh-60px)] flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {/* Page Header */}
          <div className="flex flex-col gap-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white">
              Ranking KKOL
            </h1>
            <p className="text-xs sm:text-sm text-text-500">
              Oficjalna klasyfikacja generalna zawodników Karwińskiej Olimpiady.
            </p>
          </div>

          {/* Ranking Table Card */}
          <RankingTableCard
            leaderboard={leaderboard}
            loading={loading}
          />

          {/* Explainer section */}
          <RankingExplainer />
        </div>
      </main>
      <PageFooter />
    </>
  );
}
