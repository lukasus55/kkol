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

  const menuRef = React.useRef<HTMLDivElement>(null);
  const [menuStyle, setMenuStyle] = React.useState<React.CSSProperties>({
    visibility: 'hidden',
    position: 'fixed'
  });

  React.useLayoutEffect(() => {
    if (!menuRef.current) return;
    const menuEl = menuRef.current;
    const parentTrigger = menuEl.parentElement;
    if (!parentTrigger) return;

    const triggerRect = parentTrigger.getBoundingClientRect();
    const menuRect = menuEl.getBoundingClientRect();

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pad = 8; // padding from screen edges

    const menuWidth = menuRect.width || 192;
    const menuHeight = menuRect.height || 120;

    // Prefer aligning right edge of menu to right edge of trigger
    let left = triggerRect.right - menuWidth;
    if (left + menuWidth > vw - pad) {
      left = vw - pad - menuWidth;
    }
    if (left < pad) {
      left = pad;
    }

    // Vertical placement: prefer opening above trigger (as previously intended)
    // If not enough room on top, open below
    let top = triggerRect.top - menuHeight - 6;
    if (top < pad) {
      // Open below
      top = triggerRect.bottom + 6;
      // If it still overflows bottom, clamp
      if (top + menuHeight > vh - pad) {
        top = Math.max(pad, vh - pad - menuHeight);
      }
    }

    setMenuStyle({
      position: 'fixed',
      left: `${Math.round(left)}px`,
      top: `${Math.round(top)}px`,
      visibility: 'visible',
      zIndex: 50
    });
  }, []);

  // Prevent clicks inside the menu from propagating to the row/parent
  const handleClick = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={closeMenu}
      />
      <div
        ref={menuRef}
        style={menuStyle}
        className="w-48 bg-bg-100 border border-bg-400 rounded-md shadow-xl py-1 overflow-hidden animate-in fade-in duration-150"
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
