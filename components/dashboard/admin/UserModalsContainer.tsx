'use client';

import React from 'react';
import { ConfirmationPopup } from '@/components/ui/ConfirmationPopup';
import { useToast } from '@/components/ui/ToastProvider';
import { CreateUserModal } from './CreateUserModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { UserSessionsModal } from './UserSessionsModal';
import type { UserItem } from './UserCard';

interface UserModalsContainerProps {
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  onUserCreated: () => void;

  userForPassword: UserItem | null;
  onClosePassword: () => void;

  userForSessions: UserItem | null;
  onCloseSessions: () => void;

  userForStatus: UserItem | null;
  onCloseStatus: () => void;
  onConfirmStatus: () => void;

  userForResetName: UserItem | null;
  onCloseResetName: () => void;
  onConfirmResetName: () => void;

  userForResetPfp: UserItem | null;
  onCloseResetPfp: () => void;
  onConfirmResetPfp: () => void;
}

export function UserModalsContainer({
  isCreateOpen,
  onCloseCreate,
  onUserCreated,
  userForPassword,
  onClosePassword,
  userForSessions,
  onCloseSessions,
  userForStatus,
  onCloseStatus,
  onConfirmStatus,
  userForResetName,
  onCloseResetName,
  onConfirmResetName,
  userForResetPfp,
  onCloseResetPfp,
  onConfirmResetPfp,
}: UserModalsContainerProps) {
  const { addToast } = useToast();

  return (
    <>
      <CreateUserModal
        isOpen={isCreateOpen}
        onClose={onCloseCreate}
        onCreated={() => {
          addToast({ type: 'success', message: 'Użytkownik został pomyślnie utworzony.' });
          onUserCreated();
        }}
      />

      <ResetPasswordModal
        user={userForPassword}
        isOpen={Boolean(userForPassword)}
        onClose={onClosePassword}
        onSuccess={() => {
          addToast({ type: 'success', message: 'Hasło użytkownika zostało zaktualizowane.' });
        }}
      />

      <UserSessionsModal
        user={userForSessions}
        isOpen={Boolean(userForSessions)}
        onClose={onCloseSessions}
      />

      <ConfirmationPopup
        isOpen={Boolean(userForStatus)}
        title={userForStatus?.is_active === false ? 'Odblokowanie konta' : 'Zablokowanie konta'}
        message={`Czy na pewno chcesz ${
          userForStatus?.is_active === false ? 'odblokować' : 'zablokować'
        } konto użytkownika ${userForStatus?.displayed_name} (@${userForStatus?.id})?`}
        confirmText={userForStatus?.is_active === false ? 'Odblokuj' : 'Zablokuj'}
        cancelText="Anuluj"
        onConfirm={onConfirmStatus}
        onClose={onCloseStatus}
      />

      <ConfirmationPopup
        isOpen={Boolean(userForResetName)}
        title="Wymuszenie resetu nicku"
        message={`Czy na pewno chcesz zresetować wyświetlaną nazwę gracza <strong>${userForResetName?.displayed_name}</strong> (@${userForResetName?.id}) do domyślnej <strong>Brak nazwy</strong>?`}
        confirmText="Zresetuj nazwę"
        cancelText="Anuluj"
        onConfirm={onConfirmResetName}
        onClose={onCloseResetName}
      />

      <ConfirmationPopup
        isOpen={Boolean(userForResetPfp)}
        title="Wymuszenie usunięcia awatara"
        message={`Czy na pewno chcesz usunąć niestandardowy awatar gracza <strong>${userForResetPfp?.displayed_name}</strong> (@${userForResetPfp?.id}) i przywrócić domyślne zdjęcie profilowe?`}
        confirmText="Usuń awatar"
        cancelText="Anuluj"
        onConfirm={onConfirmResetPfp}
        onClose={onCloseResetPfp}
      />
    </>
  );
}
