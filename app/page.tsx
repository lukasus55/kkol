import Link from 'next/link';
import Footer from '../components/Footer';
import EventsSection from '@/components/home/EventsSection';

export default function Home() {
  return (
    <>
      <main className='flex w-full flex-col justify-center items-center pt-16 gap-24'>

        <img
          src="/img/logos/kol-logo-horizontal.svg"
          alt="Karwińska Olimpiada Logo"
          className="h-12 w-auto md:h-16"
        />

        <EventsSection />

      </main>
    </>
  );
}
