import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, CheckCircle2, MinusCircle } from 'lucide-react';
import { TournamentActionsMenu } from './TournamentActionsMenu';
import { TournamentEditorModal } from './TournamentEditorModal';
import { TournamentEventsModal } from './TournamentEventsModal';
import { ConfirmationPopup } from '../../ui/ConfirmationPopup';
import { useToast } from '../../ui/ToastProvider';

interface TournamentRowProps {
  tournament: any;
  userRole: string;
  onRefresh: () => void;
}

export function TournamentRow({ tournament, userRole, onRefresh }: TournamentRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const { addToast } = useToast();

  const isFinished = tournament.finished;
  const name = tournament.displayed_name;
  const tier = tournament.details?.tier ?? '?';
  const pageExists = tournament.page_exists;
  const pageUrl = tournament.page_url;

  const handleEdit = () => {
    setEditorOpen(true);
  };

  const handleEvents = () => {
    setEventsOpen(true);
  };

  const handleLeave = () => {
    setLeaveConfirmOpen(true);
  };

  const confirmLeave = async () => {
    try {
      const res = await fetch('/api/tournament_leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tournamentId: tournament.id })
      });
      if (res.ok) {
        addToast({ type: 'success', message: `Pomyślnie opuszczono turniej ${name}.` });
        onRefresh();
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd przy opuszczaniu turnieju.' });
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    }
    setLeaveConfirmOpen(false);
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-bg-200 transition-colors group relative first:rounded-t-[5px] last:rounded-b-[5px]">

      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0" title={isFinished ? 'Zakończony' : 'W trakcie'}>
          {isFinished ? (
            <MinusCircle className="w-5 h-5 text-text-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-text-900" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-text-900">
            {pageExists ? (
              <Link href={`/${pageUrl}`} className="hover:underline hover:text-accent-500 transition-colors">
                {name}
              </Link>
            ) : (
              <span>{name}</span>
            )}
          </div>
          <div className="text-[11px] text-text-700 font-medium tracking-wide">
            {tier}-Tier
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* User Role */}
        <div className="text-[11px] text-text-700 font-medium tracking-wide uppercase">
          {userRole}
        </div>

        {/* More Actions Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-text-700 hover:text-text-900 transition-colors p-1 rounded-md hover:bg-bg-300"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>

        {menuOpen && (
          <TournamentActionsMenu
            userRole={userRole}
            onEdit={handleEdit}
            onEvents={handleEvents}
            onLeave={handleLeave}
            closeMenu={() => setMenuOpen(false)}
          />
        )}
      </div>

      <TournamentEditorModal
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        tournament={tournament}
        userRole={userRole}
        onSuccess={onRefresh}
      />

      <TournamentEventsModal
        isOpen={eventsOpen}
        onClose={() => setEventsOpen(false)}
        tournament={tournament}
      />

      <ConfirmationPopup
        isOpen={leaveConfirmOpen}
        title="Opuszczanie turnieju"
        message={`Czy na pewno chcesz opuścić turniej ${name}?`}
        confirmText="Opuść turniej"
        onConfirm={confirmLeave}
        onClose={() => setLeaveConfirmOpen(false)}
      />
    </div>
  );
}
