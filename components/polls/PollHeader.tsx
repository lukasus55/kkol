import { useState } from 'react';
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
}

export default function PollHeader({
  poll, mode, setMode, permissions, labels,
  filterQuery, setFilterQuery, selectedLabels, setSelectedLabels
}: PollHeaderProps) {

  const [isFilterOpen, setIsFilterOpen] = useState(false);

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
    <div className="w-full bg-bg-200 border border-bg-400 rounded-md p-4 md:p-6 flex flex-col gap-6 shadow-sm">

      {/* TOP ROW: Name & Dates */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-text-900 font-markazi break-words">
          {poll.name}
        </h1>
        <div className="flex items-center gap-2 text-text-500 text-sm">
          <Clock className="w-4 h-4" />
          <span title={formattedDate}>Koniec: {formattedDate}</span>
        </div>
      </div>

      {/* BOTTOM ROW: Modes & Tools */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-t border-bg-300 pt-4">

        {/* MODES */}
        <div className="flex items-center gap-2 bg-bg-100 p-1 rounded-md border border-bg-300 w-full md:w-auto overflow-x-auto">

          <button
            onClick={() => setMode('vote')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap flex-1 md:flex-none ${mode === 'vote' ? 'bg-bg-300 text-text-900 shadow-sm' : 'text-text-500 hover:text-text-700 hover:bg-bg-200'}`}
          >
            <CheckSquare className="w-4 h-4" />
            <span className="font-medium text-sm">Głosowanie</span>
          </button>

          <button
            onClick={() => setMode('results')}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap flex-1 md:flex-none ${mode === 'results' ? 'bg-bg-300 text-text-900 shadow-sm' : 'text-text-500 hover:text-text-700 hover:bg-bg-200'}`}
          >
            <BarChart2 className="w-4 h-4" />
            <span className="font-medium text-sm">Wyniki</span>
          </button>

          {permissions.canEditQuestions && (
            <button
              onClick={() => setMode('edit')}
              className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all whitespace-nowrap flex-1 md:flex-none ${mode === 'edit' ? 'bg-bg-300 text-text-900 shadow-sm' : 'text-text-500 hover:text-text-700 hover:bg-bg-200'}`}
            >
              <Pencil className="w-4 h-4" />
              <span className="font-medium text-sm">Edycja</span>
            </button>
          )}

        </div>

        {/* TOOLS */}
        <div className="flex items-center gap-2 w-full md:w-auto">

          {/* Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${selectedLabels.length > 0 || filterQuery ? 'border-accent-500 text-accent-500 bg-accent-500/10' : 'border-bg-400 text-text-700 hover:bg-bg-300'}`}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Filtry</span>
            </button>

            {isFilterOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-64 bg-bg-200 border border-bg-400 rounded-md shadow-xl z-50 p-4 flex flex-col gap-4 animate-in fade-in slide-in-from-top-2">
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
                              className={`px-2 py-1 rounded-md text-xs font-medium border flex items-center gap-1.5 transition-colors`}
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
            <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-bg-400 text-text-700 hover:bg-bg-300 transition-colors">
              <Tag className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Etykiety</span>
            </button>
          )}

          {permissions.canEditSettings && (
            <button className="flex items-center gap-2 px-3 py-2 rounded-md border border-bg-400 text-text-700 hover:bg-bg-300 transition-colors">
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline text-sm font-medium">Ustawienia</span>
            </button>
          )}

        </div>

      </div>
    </div>
  );
}
