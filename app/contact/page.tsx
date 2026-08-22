import React from 'react';
import { Mail } from 'lucide-react';
import PageFooter from '@/components/ui/PageFooter';

export const metadata = {
  title: 'Kontakt - Karwińska Olimpiada',
  description: 'Skontaktuj się z administracją i zarządem Karwińskiej Olimpiady.',
};

export default function ContactPage() {
  return (
    <>
      <div className="min-h-[70vh] flex flex-col items-center py-16 px-4 font-sans">
        <div className="w-full max-w-2xl bg-bg-100 rounded-md p-8 sm:p-12">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-text-900 mb-8 text-center border-b border-bg-300 pb-4">
            Lista kontaktów
          </h1>

          <div className="space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-bg-200 rounded-md border border-bg-300">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-text-900 mb-1">Administrator strony</h2>
                <p className="text-sm text-text-600">Sprawy techniczne, błędy, konta użytkowników</p>
              </div>
              <a 
                href="mailto:admin@kkol.pl" 
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-md transition-colors w-fit"
              >
                <Mail className="w-4 h-4" />
                admin@kkol.pl
              </a>
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-bg-200 rounded-md border border-bg-300">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-bold text-text-900 mb-1">Zarząd KKOL</h2>
                <p className="text-sm text-text-600">Organizacja, współpraca, pytania ogólne</p>
              </div>
              <a 
                href="mailto:zarzad@kkol.pl" 
                className="flex items-center gap-2 bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-md transition-colors w-fit"
              >
                <Mail className="w-4 h-4" />
                zarzad@kkol.pl
              </a>
            </div>

          </div>
        </div>
      </div>
      <PageFooter />
    </>
  );
}
