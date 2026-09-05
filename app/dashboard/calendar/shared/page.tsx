'use client';

import { useUser } from '../../../../components/dashboard/UserProvider';

export default function SharedAvailabilityPage() {
  const { user } = useUser();
  if (!user) return null;

  return (
    <div className="h-full w-full p-4 overflow-hidden">
      <div className="bg-bg-200 rounded-md p-6 h-full w-full flex flex-col items-center justify-center">
        <h2 className="text-xl font-bold text-text-900 mb-2">Dostępność innych</h2>
        <p className="text-text-500 text-center max-w-md">
          Ta funkcja nie jest jeszcze zaimplementowana. W przyszłości będziesz mógł tutaj sprawdzić, kiedy Twoi znajomi mają czas na grę.
        </p>
      </div>
    </div>
  );
}
