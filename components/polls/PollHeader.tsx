import { useState, useEffect } from 'react';
import { Clock, Filter, Tag, Settings, BarChart2, Pencil, CheckSquare, Search } from 'lucide-react';

interface PollHeaderProps {
  poll: any;
  mode: 'vote' | 'results' | 'edit';
  setMode: (m: 'vote' | 'results' | 'edit') => void;
  permissions: any;
  labels: any[];
  filterQuery: string;
  setFilterQuery: (q: string) => void;
  selectedLabels: string[];
  setSelectedLabels: React.Dispatch<React.SetStateAction<string[]>>;
  onOpenSettings?: () => void;
  onOpenLabels?: () => void;
}

export default function PollHeader({
  poll, mode, setMode, permissions, labels,
  filterQuery, setFilterQuery, selectedLabels, setSelectedLabels,
  onOpenSettings, onOpenLabels
}: PollHeaderProps) {

  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFilterOpen) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFilterOpen]);

  const toggleLabelFilter = (id: string) => {
    setSelectedLabels(prev =>
      prev.includes(id) ? prev.filter(l => l !== id) : [...prev, id]
    );
  };

  // Basic date formatting
  const formattedDate = new Intl.DateTimeFormat('pl-PL', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(poll.end_date));

  return (
    <>
      {/* TABS & TOOLS - Sticky Top Bar (100% width background) */}
      <div className="w-full sticky top-0 z-[60] bg-bg-200 border-b border-bg-300 shadow-sm">
        <div className="w-full max-w-[800px] mx-auto px-4 pt-3 flex flex-col md:flex-row md:items-end justify-between gap-4">

          {/* TABS */}
          <div className="flex items-center gap-6 overflow-x-auto w-full md:w-auto scrollbar-hide">
            <button
              onClick={() => setMode('vote')}
              className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${mode === 'vote' ? 'border-accent-500 text-accent-600' : 'border-transparent text-text-500 hover:text-text-800 hover:border-bg-400'}`}
            >
              Głosowanie
            </button>

            <button
              onClick={() => setMode('results')}
              className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${mode === 'results' ? 'border-accent-500 text-accent-600' : 'border-transparent text-text-500 hover:text-text-800 hover:border-bg-400'}`}
            >
              Wyniki
            </button>

            {permissions.canEditQuestions && (
              <button
                onClick={() => setMode('edit')}
                className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 whitespace-nowrap flex items-center gap-2 ${mode === 'edit' ? 'border-accent-500 text-accent-600' : 'border-transparent text-text-500 hover:text-text-800 hover:border-bg-400'}`}
              >
                Edycja
              </button>
            )}
          </div>

          {/* TOOLS */}
          <div className="flex items-center gap-4 pb-3 w-full md:w-auto justify-end">

            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${selectedLabels.length > 0 || filterQuery ? 'text-accent-500' : 'text-text-500 hover:text-text-900'}`}
              >
                <Filter className="w-4 h-4" />
                <span className="hidden md:inline">Filtry</span>
              </button>

              {isFilterOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                  <div className="absolute right-0 md:right-1/2 md:translate-x-1/2 top-full mt-2 w-64 bg-bg-100 border border-bg-300 rounded-md shadow-xl z-50 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-500" />
                      <input
                        type="text"
                        placeholder="Szukaj pytania..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full bg-bg-100 border border-bg-300 text-text-900 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-accent-500"
                      />
                    </div>

                    {labels.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-text-500 uppercase tracking-wider">Etykiety</span>
                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto pr-1">
                          {labels.map(lbl => {
                            const isSelected = selectedLabels.includes(lbl.id);
                            return (
                              <button
                                key={lbl.id}
                                onClick={() => toggleLabelFilter(lbl.id)}
                                className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-opacity cursor-pointer hover:opacity-75`}
                                style={{
                                  borderColor: isSelected ? lbl.hex : 'var(--color-bg-400)',
                                  backgroundColor: isSelected ? `${lbl.hex}20` : 'transparent',
                                  color: isSelected ? lbl.hex : 'var(--color-text-700)'
                                }}
                              >
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: lbl.hex }} />
                                {lbl.name}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {permissions.canEditLabels && (
              <button onClick={onOpenLabels} className="flex items-center gap-1.5 text-sm font-medium text-text-500 hover:text-text-900 transition-colors">
                <Tag className="w-4 h-4" />
                <span className="hidden md:inline">Etykiety</span>
              </button>
            )}

            {permissions.canEditSettings && (
              <button onClick={onOpenSettings} className="flex items-center gap-1.5 text-sm font-medium text-text-500 hover:text-text-900 transition-colors">
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Ustawienia</span>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* TITLE CARD (Google Forms Style) */}
      <div className="w-full max-w-[800px] mx-auto px-4 mt-8">
        <div className="w-full bg-bg-200 rounded-md border-t-[8px] border-t-accent-500 p-6 md:p-8 flex flex-col gap-3 shadow-sm mb-4">
          <h1 className="text-3xl md:text-5xl font-bold text-text-900 font-markazi break-words leading-tight">
            {poll.name}
          </h1>
          <div className="flex items-center gap-2 text-text-500 text-sm mt-1">
            <Clock className="w-4 h-4" />
            <span title={formattedDate}>Koniec: {formattedDate}</span>
          </div>
        </div>
      </div>
    </>
  );
}
