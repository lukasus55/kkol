'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, Plus, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { ConfirmationPopup } from '@/components/ui/ConfirmationPopup';
import { useToast } from '@/components/ui/ToastProvider';
import type { Trivia } from '@/types/db';
import { TriviaFilters } from './TriviaFilters';
import { TriviaCard } from './TriviaCard';
import { TriviaModal } from './TriviaModal';

const ITEMS_PER_PAGE = 10;

export function TriviaTab() {
  const { addToast } = useToast();
  const [triviaList, setTriviaList] = useState<Trivia[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'used'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [triviaToEdit, setTriviaToEdit] = useState<Trivia | null>(null);
  const [triviaToDelete, setTriviaToDelete] = useState<Trivia | null>(null);

  const fetchTrivia = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/trivia');
      if (!res.ok) throw new Error('Błąd ładowania ciekawostek');
      const data = await res.json();
      setTriviaList(data.trivia || []);
    } catch {
      addToast({ message: 'Nie udało się załadować ciekawostek', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchTrivia();
  }, [fetchTrivia]);

  // Counts
  const counts = useMemo(() => {
    let pending = 0;
    let used = 0;
    triviaList.forEach((t) => {
      if (t.is_used) used++;
      else pending++;
    });
    return { total: triviaList.length, pending, used };
  }, [triviaList]);

  // Filtered and paginated list
  const filteredList = useMemo(() => {
    return triviaList.filter((item) => {
      if (statusFilter === 'pending' && item.is_used) return false;
      if (statusFilter === 'used' && !item.is_used) return false;
      if (search.trim()) {
        const query = search.trim().toLowerCase();
        if (!item.content.toLowerCase().includes(query)) return false;
      }
      return true;
    });
  }, [triviaList, statusFilter, search]);

  const totalPages = Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredList.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredList, currentPage]);

  const handleOpenAdd = () => {
    setTriviaToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (trivia: Trivia) => {
    setTriviaToEdit(trivia);
    setIsModalOpen(true);
  };

  const handleModalSuccess = (trivia: Trivia, isEdit: boolean) => {
    if (isEdit) {
      setTriviaList((prev) => prev.map((t) => (t.id === trivia.id ? trivia : t)));
    } else {
      setTriviaList((prev) => [trivia, ...prev]);
    }
  };

  const handleToggleUsed = async (trivia: Trivia) => {
    const nextState = !trivia.is_used;
    try {
      const res = await fetch('/api/admin/trivia', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: trivia.id, is_used: nextState }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTriviaList((prev) => prev.map((t) => (t.id === trivia.id ? data.trivia : t)));
      addToast({
        message: nextState ? 'Oznaczono ciekawostkę jako wysłaną' : 'Cofnięto do kolejki oczekujących',
        type: 'success',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd zmiany statusu';
      addToast({ message, type: 'error' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!triviaToDelete) return;
    try {
      const res = await fetch(`/api/admin/trivia?id=${triviaToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setTriviaList((prev) => prev.filter((t) => t.id !== triviaToDelete.id));
      addToast({ message: 'Ciekawostka została pomyślnie usunięta.', type: 'success' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Błąd usuwania ciekawostki';
      addToast({ message, type: 'error' });
    } finally {
      setTriviaToDelete(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
      {/* Header and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            Ciekawostki Discord
          </h1>
          <p className="text-sm text-text-700 mt-1">
            Zarządzanie cotygodniowymi ciekawostkami ligowymi publikowanymi przez bota.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Dodaj ciekawostkę</span>
        </Button>
      </div>

      {/* Filters and search */}
      <TriviaFilters
        search={search}
        onSearchChange={(val) => {
          setSearch(val);
          setCurrentPage(1);
        }}
        statusFilter={statusFilter}
        onStatusChange={(val) => {
          setStatusFilter(val);
          setCurrentPage(1);
        }}
        counts={counts}
      />

      {/* Trivia items list */}
      {loading ? (
        <div className="flex flex-col gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-bg-200 rounded-md animate-pulse border border-bg-300" />
          ))}
        </div>
      ) : paginatedList.length > 0 ? (
        <div className="flex flex-col gap-4">
          {paginatedList.map((trivia) => (
            <TriviaCard
              key={trivia.id}
              trivia={trivia}
              onEdit={handleOpenEdit}
              onDelete={setTriviaToDelete}
              onToggleUsed={handleToggleUsed}
            />
          ))}
        </div>
      ) : (
        <div className="bg-bg-200 border border-bg-300 rounded-md p-10 text-center flex flex-col items-center justify-center gap-3">
          <AlertCircle className="w-10 h-10 text-text-500" />
          <h3 className="text-base font-semibold text-text-900">Brak ciekawostek</h3>
          <p className="text-sm text-text-700 max-w-sm">
            {search.trim() || statusFilter !== 'all'
              ? 'Nie znaleziono żadnych ciekawostek spełniających podane kryteria.'
              : 'Nie dodano jeszcze żadnych ciekawostek do bazy. Kliknij przycisk powyżej, aby dodać pierwszą.'}
          </p>
          {search.trim() || statusFilter !== 'all' ? (
            <Button
              variant="secondary"
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
              }}
              className="mt-2 text-xs"
            >
              Wyczyść filtry
            </Button>
          ) : (
            <Button variant="primary" onClick={handleOpenAdd} className="mt-2 text-xs">
              Dodaj ciekawostkę
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredList.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </div>
      )}

      {/* Add / Edit Modal */}
      <TriviaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
        triviaToEdit={triviaToEdit}
      />

      {/* Delete Confirmation Popup */}
      <ConfirmationPopup
        isOpen={Boolean(triviaToDelete)}
        title="Usuwanie ciekawostki"
        message={`Czy na pewno chcesz usunąć tę ciekawostkę?<br/><br/><em class="text-text-700">"${
          triviaToDelete ? (triviaToDelete.content.length > 80 ? triviaToDelete.content.substring(0, 80) + '...' : triviaToDelete.content) : ''
        }"</em>`}
        confirmText="Usuń ciekawostkę"
        cancelText="Anuluj"
        onConfirm={handleDeleteConfirm}
        onClose={() => setTriviaToDelete(null)}
      />
    </div>
  );
}
