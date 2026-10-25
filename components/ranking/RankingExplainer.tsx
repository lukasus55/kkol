import React from 'react';
import { HelpCircle } from 'lucide-react';

export function RankingExplainer() {
  return (
    <div className="w-full bg-bg-200 rounded-md p-4 sm:p-6 flex flex-col gap-4 text-sm text-text-700 leading-relaxed">
      {/* Header */}
      <div className="flex items-center gap-2 pb-3 border-b border-bg-300">
        <HelpCircle className="w-4 h-4 text-text-500 shrink-0" />
        <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
          Zasady Punktacji Rankingu KKOL
        </h3>
      </div>

      <p className="text-text-500 text-xs sm:text-sm">
        Oficjalny ranking KKOL wyliczany jest jako suma dwóch niezależnych składowych:
      </p>

      {/* Rules list */}
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-text-700 mt-2 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong className="text-white">S-SCORE:</strong> Średnia z 2 ostatnich (w ujęciu globalnym) turniejów rangi{' '}
            <strong className="text-amber-300">S-Tier</strong> (15 pkt, 10 pkt, 5 pkt). Nieobecność na którymkolwiek z tych turniejów oznacza 0 punktów wliczanych do średniej (wynik zawsze dzielony przez 2).
          </div>
        </div>

        <div className="flex items-start gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-text-700 mt-2 shrink-0" />
          <div className="text-xs sm:text-sm">
            <strong className="text-white">AB-SCORE:</strong> Średnia z 3 ostatnich (w ujęciu globalnym) turniejów rangi{' '}
            <strong className="text-purple-300">A-Tier</strong> lub{' '}
            <strong className="text-sky-300">B-Tier</strong> (7 pkt, 4 pkt, 1 pkt). Nieobecność to 0 punktów wliczanych do średniej z 3 turniejów (wynik zawsze dzielony przez 3).
          </div>
        </div>
      </div>

      {/* Tie breaker note */}
      <div className="pt-3 border-t border-bg-300 text-xs text-text-500 italic">
        W przypadku remisu na danej pozycji w turnieju punkty rankingowe za zajęte miejsca są sumowane, a następnie dzielone po równo. Kolejne miejsce w klasyfikacji zostaje pominięte o liczbę zawodników biorących udział w remisie.
      </div>
    </div>
  );
}

export default RankingExplainer;
