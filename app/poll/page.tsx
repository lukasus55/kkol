'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function PollRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams?.get('p');
    if (id) {
      // Pass the mode param as well if it exists
      const mode = searchParams?.get('m');
      const queryString = mode ? `?m=${mode}` : '';
      router.replace(`/poll/${id}${queryString}`);
    } else {
      router.replace('/dashboard?tab=polls');
    }
  }, [router, searchParams]);

  return (
    <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-200">
      <div className="text-text-500 font-medium animate-pulse">Przekierowywanie...</div>
    </div>
  );
}

export default function PollRedirect() {
  return (
    <Suspense fallback={
      <div className="flex h-[calc(100vh-60px)] items-center justify-center bg-bg-200">
        <div className="text-text-500 font-medium animate-pulse">Przekierowywanie...</div>
      </div>
    }>
      <PollRedirectInner />
    </Suspense>
  );
}
