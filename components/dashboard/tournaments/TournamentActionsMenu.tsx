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
        className="absolute left-0 bottom-full mb-2 w-48 bg-dashboard-bg border border-dashboard-stroke rounded-md shadow-xl z-50 py-1 overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200"
        onClick={handleClick}
      >
        {canEdit && (
          <button 
            onClick={() => { onEdit(); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dashboard-text hover:bg-dashboard-bg-s2 hover:text-dashboard-text transition-colors text-left"
          >
            <Edit className="w-4 h-4 text-dashboard-text-s2" />
            Edytuj turniej
          </button>
        )}

        <button 
          onClick={() => { onEvents(); closeMenu(); }}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dashboard-text hover:bg-dashboard-bg-s2 hover:text-dashboard-text transition-colors text-left"
        >
          <CalendarDays className="w-4 h-4 text-dashboard-text-s2" />
          Wydarzenia
        </button>

        {canLeave && (
          <button 
            onClick={() => { onLeave(); closeMenu(); }}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-dashboard-danger hover:bg-dashboard-danger/10 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            Opuść turniej
          </button>
        )}
      </div>
    </>
  );
}
