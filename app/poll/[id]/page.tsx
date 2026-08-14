import { Suspense } from 'react';
import PollClient from './PollClient';

export default function PollPage() {
  return (
    <main className="w-full min-h-[calc(100vh-60px)] bg-bg-100 flex justify-center text-text-900 pb-20">
      <Suspense fallback={
        <div className="flex items-center justify-center w-full h-[50vh]">
          <div className="w-12 h-12 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <PollClient />
      </Suspense>
    </main>
  );
}
