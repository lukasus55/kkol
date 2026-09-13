import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import HeroStandingsTable from '@/components/home/HeroStandingsTable';
import HeroEventsWidget from '@/components/home/HeroEventsWidget';
import HeroUpcomingEventWidget from '@/components/home/HeroUpcomingEventWidget';
import PlayersSection from '@/components/home/PlayersSection';
import PageFooter from '@/components/ui/PageFooter';

export const metadata = {
  title: 'Strona Główna - Karwińska Olimpiada',
  description: 'Oficjalna strona Karwińskiej Olimpiady. Śledź statystyki, wydarzenia i rankingi wszystkich graczy.',
};

export default function Home() {
  return (
    <>
      <main className="flex w-full flex-col items-center gap-14 sm:gap-20">
        {/* HERO SECTION - natural layout, comfortable on 1080p without forcing 100vh */}
        <section className="w-full max-w-[1016px] px-8 sm:px-12 py-5 flex flex-col gap-5 box-border">
          {/* Duży baner ze zdjęciami i rotacją sezonów (bez CTA) */}
          <div className="w-full shrink-0">
            <HeroBanner />
          </div>

          {/* Boksy: Kolumna lewa (Tabela + Najbliższe Wydarzenie) i Kolumna prawa (Rozgrywki) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch flex-1">
            {/* Lewa kolumna: Tabela Sezonu 2026 + Najbliższe wydarzenie (7 kolumn na desktopie) */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-5">
              <div className="flex-1 flex">
                <HeroStandingsTable />
              </div>
              <div className="shrink-0">
                <HeroUpcomingEventWidget />
              </div>
            </div>

            {/* Prawa kolumna: Rozgrywki (5 kolumn na desktopie) */}
            <div className="lg:col-span-5 flex">
              <HeroEventsWidget />
            </div>
          </div>
        </section>

        <PlayersSection />
      </main>
      <PageFooter />
    </>
  );
}
