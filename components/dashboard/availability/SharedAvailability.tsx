'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useToast } from '../../ui/ToastProvider';
import { Input } from '../../ui/Input';
import { ChevronRight } from 'lucide-react';
import { ListRowSkeleton } from '../../ui/Skeleton';
import { Pagination } from '../../ui/Pagination';
import { FriendWeeklySchedule } from './FriendWeeklySchedule';
import { computeLiveStatus, getStatusDetails } from '../summary/availabilityHelper';

const ITEMS_PER_PAGE = 8;

export default function SharedAvailability({ user }: { user: any }) {
  const { addToast } = useToast();
  const [friends, setFriends] = useState<any[]>([]);
  const [defaults, setDefaults] = useState<any[]>([]);
  const [overrides, setOverrides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const fetchShared = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/availability_shared');
      if (res.ok) {
        const data = await res.json();
        setFriends(data.friends || []);
        setDefaults(data.defaults || []);
        setOverrides(data.overrides || []);
      }
    } catch (e) {
      addToast({ type: 'error', message: 'Nie udało się pobrać dostępności innych.' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchShared();
  }, [fetchShared]);

  const filteredFriends = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return friends;
    return friends.filter((f) => f.displayed_name?.toLowerCase().includes(query));
  }, [friends, searchQuery]);

  const totalPages = Math.ceil(filteredFriends.length / ITEMS_PER_PAGE);
  const paginatedFriends = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredFriends.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredFriends, page]);

  const selectedUser = friends.find((f) => f.id === selectedUserId);

  if (selectedUserId && selectedUser) {
    return (
      <FriendWeeklySchedule
        friend={selectedUser}
        defaults={defaults}
        overrides={overrides}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col w-full h-full min-h-0 pb-6 px-4 sm:px-8 pt-4 gap-6 sm:gap-8 max-w-4xl mx-auto overflow-y-auto custom-scrollbar">
      {/* Search Bar */}
      <div className="w-full flex-shrink-0">
        <Input
          placeholder="Szukaj gracza po nazwie..."
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
        />
      </div>

      {/* Players Card List */}
      <div className="flex flex-col gap-3 w-full flex-1 pb-4">
        {loading ? (
          <ListRowSkeleton count={4} />
        ) : filteredFriends.length === 0 ? (
          <div className="text-center text-text-500 py-10 font-medium">
            {searchQuery
              ? 'Nie znaleziono graczy pasujących do wyszukiwania.'
              : 'Nie ma obecnie innych graczy w Twoich aktywnych turniejach.'}
          </div>
        ) : (
          <>
            {paginatedFriends.map((f) => {
              const status = computeLiveStatus(f.id, defaults, overrides);
              const details = getStatusDetails(status);
              const avatarSrc = f.pfp_base64
                ? (f.pfp_base64.startsWith('data:image') ? f.pfp_base64 : 'data:image/jpeg;base64,' + f.pfp_base64)
                : '/img/default_pfp.webp';

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedUserId(f.id)}
                  className="flex items-center justify-between bg-bg-200 rounded-md p-4 sm:p-5 hover:bg-bg-300 transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-bg-300 border border-bg-400 overflow-hidden shrink-0">
                      <img
                        src={avatarSrc}
                        alt={f.displayed_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-text-900 text-[15px] group-hover:text-white transition-colors truncate block">
                        {f.displayed_name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-bg-100 group-hover:bg-bg-200 transition-colors">
                      <div className={`w-2 h-2 rounded-full ${details.dotClass}`} />
                      <span className={`text-xs ${details.textClass}`}>
                        {details.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-text-500 group-hover:text-text-700 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              );
            })}

            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredFriends.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
