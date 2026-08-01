import React, { useState } from 'react';
import Link from 'next/link';
import { MoreHorizontal, CheckCircle2, MinusCircle } from 'lucide-react';
import { TournamentActionsMenu } from './TournamentActionsMenu';
import { TournamentEditorModal } from './TournamentEditorModal';

interface TournamentRowProps {
  tournament: any;
  userRole: string;
  onRefresh: () => void;
}

export function TournamentRow({ tournament, userRole, onRefresh }: TournamentRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);

  const isFinished = tournament.finished;
  const name = tournament.displayed_name;
  const tier = tournament.details?.tier ?? '?';
  const pageExists = tournament.page_exists;
  const pageUrl = tournament.page_url;

  const handleEdit = () => {
    setEditorOpen(true);
  };

  const handleEvents = () => {
    alert('Otwieram modal wydarzeń: ' + name);
  };

  const handleLeave = () => {
    if (confirm(`Czy na pewno chcesz opuścić turniej ${name}?`)) {
      alert('Opuszczanie...');
    }
  };

  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors group relative first:rounded-t-[5px] last:rounded-b-[5px]">
      
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0" title={isFinished ? 'Zakończony' : 'W trakcie'}>
          {isFinished ? (
            <MinusCircle className="w-5 h-5 text-gray-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-dashboard-primary" />
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="text-sm font-semibold text-white">
            {pageExists ? (
              <Link href={`/${pageUrl}`} className="hover:underline hover:text-dashboard-primary transition-colors">
                {name}
              </Link>
            ) : (
              <span>{name}</span>
            )}
          </div>
          <div className="text-[11px] text-dashboard-text-s2 font-medium tracking-wide">
            {tier}-Tier
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* User Role */}
        <div className="text-[11px] text-dashboard-text-s2 font-medium tracking-wide uppercase">
          {userRole}
        </div>

        {/* More Actions Button */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-dashboard-text-s2 hover:text-white transition-colors p-1 rounded-md hover:bg-white/10"
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
    </div>
  );
}
