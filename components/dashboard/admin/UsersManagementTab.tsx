'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { useToast } from '@/components/ui/ToastProvider';
import { useUser } from '@/components/dashboard/UserProvider';
import { UsersFilters } from './UsersFilters';
import { UserCard, UserItem } from './UserCard';
import { UserModalsContainer } from './UserModalsContainer';

const ITEMS_PER_PAGE = 12;

export function UsersManagementTab() {
  const { user: currentUser } = useUser();
  const { addToast } = useToast();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & pagination
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [userForStatus, setUserForStatus] = useState<UserItem | null>(null);
  const [userForPassword, setUserForPassword] = useState<UserItem | null>(null);
  const [userForSessions, setUserForSessions] = useState<UserItem | null>(null);
  const [userForResetName, setUserForResetName] = useState<UserItem | null>(null);
  const [userForResetPfp, setUserForResetPfp] = useState<UserItem | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter);

      const res = await fetch(`/api/admin/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        addToast({ type: 'error', message: 'Nie udało się pobrać listy użytkowników.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, addToast]);

  useEffect(() => {
    fetchUsers();
    setCurrentPage(1);
  }, [fetchUsers]);

  // Paginated slice
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return users.slice(start, start + ITEMS_PER_PAGE);
  }, [users, currentPage]);

  const totalPages = Math.ceil(users.length / ITEMS_PER_PAGE);

  // 1-Click Role Toggle
  const handleToggleRole = async (targetUser: UserItem, nextRole: 'player' | 'organizer') => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: targetUser.id, role: nextRole }),
      });

      if (res.ok) {
        const roleLabel = nextRole === 'organizer' ? 'Organizator' : 'Gracz';
        addToast({
          type: 'success',
          message: `Rola użytkownika ${targetUser.displayed_name} została zmieniona na: ${roleLabel}.`,
        });
        fetchUsers();
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Nie udało się zmienić roli.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    }
  };

  // Status Toggle Confirmation
  const handleToggleStatusConfirm = async () => {
    if (!userForStatus) return;
    const targetStatus = userForStatus.is_active === false;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userForStatus.id, is_active: targetStatus }),
      });

      if (res.ok) {
        addToast({
          type: 'success',
          message: targetStatus ? 'Konto zostało odblokowane.' : 'Konto zostało zablokowane.',
        });
        fetchUsers();
      } else {
        const data = await res.json();
        addToast({ type: 'error', message: data.error || 'Wystąpił błąd.' });
      }
    } catch {
      addToast({ type: 'error', message: 'Błąd połączenia z serwerem.' });
    } finally {
      setUserForStatus(null);
    }
  };

  const handleConfirmResetName = async () => {
    if (!userForResetName) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userForResetName.id, reset_name: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers((prev) =>
        prev.map((u) => (u.id === userForResetName.id ? { ...u, displayed_name: 'Brak nazwy' } : u))
      );
      addToast({ type: 'success', message: 'Nazwa użytkownika została zresetowana na "Brak nazwy".' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas resetowania nazwy';
      addToast({ type: 'error', message: msg });
    } finally {
      setUserForResetName(null);
    }
  };

  const handleConfirmResetPfp = async () => {
    if (!userForResetPfp) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: userForResetPfp.id, reset_pfp: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setUsers((prev) =>
        prev.map((u) => (u.id === userForResetPfp.id ? { ...u, pfp_base64: null } : u))
      );
      addToast({ type: 'success', message: 'Awatar użytkownika został usunięty (przywrócono domyślny).' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Błąd podczas usuwania awatara';
      addToast({ type: 'error', message: msg });
    } finally {
      setUserForResetPfp(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-amber-400" />
            Zarządzanie Użytkownikami
          </h1>
          <p className="text-sm text-text-700 mt-1">
            Przegląd kont ligowych, edycja uprawnień, reset haseł i menadżer sesji.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Dodaj użytkownika</span>
        </Button>
      </div>

      {/* Filters */}
      <UsersFilters
        search={search}
        onSearchChange={setSearch}
        roleFilter={roleFilter}
        onRoleChange={setRoleFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Users Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-bg-200 rounded-md animate-pulse p-5" />
          ))}
        </div>
      ) : paginatedUsers.length === 0 ? (
        <div className="p-12 text-center bg-bg-200 rounded-md border border-bg-300">
          <p className="text-base text-text-700 font-medium">Nie znaleziono żadnych użytkowników.</p>
          <p className="text-xs text-text-500 mt-1">Zmień kryteria wyszukiwania lub zresetuj filtry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {paginatedUsers.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              currentUserId={currentUser?.id || ''}
              onToggleRole={handleToggleRole}
              onToggleStatus={setUserForStatus}
              onResetPassword={setUserForPassword}
              onOpenSessions={setUserForSessions}
              onResetName={setUserForResetName}
              onResetPfp={setUserForResetPfp}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={users.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      )}

      {/* Modals & Confirmation Popups */}
      <UserModalsContainer
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => setIsCreateOpen(false)}
        onUserCreated={fetchUsers}
        userForPassword={userForPassword}
        onClosePassword={() => setUserForPassword(null)}
        userForSessions={userForSessions}
        onCloseSessions={() => setUserForSessions(null)}
        userForStatus={userForStatus}
        onCloseStatus={() => setUserForStatus(null)}
        onConfirmStatus={handleToggleStatusConfirm}
        userForResetName={userForResetName}
        onCloseResetName={() => setUserForResetName(null)}
        onConfirmResetName={handleConfirmResetName}
        userForResetPfp={userForResetPfp}
        onCloseResetPfp={() => setUserForResetPfp(null)}
        onConfirmResetPfp={handleConfirmResetPfp}
      />
    </div>
  );
}
