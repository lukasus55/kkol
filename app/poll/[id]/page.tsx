import { Suspense } from 'react';
import type { Metadata, ResolvingMetadata } from 'next';
import { headers } from 'next/headers';
import PollClient from './PollClient';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const headersList = await headers();
  const host = headersList.get('host') || 'localhost:3000';
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  try {
    const res = await fetch(`${baseUrl}/api/polls?id=${id}`, { cache: 'no-store' });
    const data = await res.json();
    if (data && data.length > 0 && data[0].title) {
      return {
        title: `Ankieta: ${data[0].title} - Karwińska Olimpiada`,
        description: `Weź udział w ankiecie: ${data[0].title} w ramach Karwińskiej Olimpiady.`,
      };
    }
  } catch (error) {}

  return {
    title: 'Ankieta - Karwińska Olimpiada',
    description: 'Wypełnij ankietę Karwińskiej Olimpiady.',
  };
}

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
