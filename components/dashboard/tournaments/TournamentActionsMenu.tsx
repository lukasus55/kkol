import React from 'react';
import { Edit, CalendarDays, LogOut } from 'lucide-react';

interface TournamentActionsMenuProps {
  userRole: string;
  onEdit: () => void;
  onEvents: () => void;
  onLeave: () => void;
  closeMenu: () => void;
}

export function TournamentActionsMenu({ userRole, onEdit, onEvents, onLeave, closeMenu }: TournamentActionsMenuProps) {
  const canEdit = userRole === 'owner' || userRole === 'manager';
  const canLeave = userRole !== 'owner';

  // Prevent clicks inside the menu from propagating to the row/parent
  const handleClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={closeMenu}
      />
      <div
        className="absolute left-0 bottom-full mb-2 w-48 bg-bg-100 border border-bg-400 rounded-md shadow-xl z-50 py-1 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200"
        onClick={handleClick}
      >
        {canEdit && (
          <button
            onClick={() => { onEdit(); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-900 hover:bg-bg-200 hover:text-text-900 transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-text-700" />
            Edytuj turniej
          </button>
        )}

        <button
          onClick={() => { onEvents(); closeMenu(); }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-text-900 hover:bg-bg-200 hover:text-text-900 transition-colors text-left"
        >
          <CalendarDays className="w-4 h-4 text-text-700" />
          Wydarzenia
        </button>

        {canLeave && (
          <button
            onClick={() => { onLeave(); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-500 hover:bg-danger-500/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Opuść turniej
          </button>
        )}
      </div>
    </>
  );
}
