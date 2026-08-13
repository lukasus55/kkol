import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Polityka Prywatności - Karwińska Olimpiada',
  description: 'Zasady przetwarzania danych osobowych i polityka prywatności KKOL.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-[70vh] flex justify-center py-12 px-4 font-sans">
      <div className="w-full max-w-4xl bg-bg-100 rounded-md p-6 sm:p-10 shadow-sm">
        <div className="border-b border-bg-300 pb-6 mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-bold uppercase tracking-wide text-text-900 mb-2">
            Polityka Prywatności
          </h1>
          <p className="text-sm font-semibold text-text-500">
            Data ostatniej aktualizacji: 06.04.2026
          </p>
        </div>

        <div className="prose prose-invert max-w-none text-text-700 leading-relaxed space-y-8">
          
          <p className="text-lg font-medium text-text-800">
            Niniejsza strona jest projektem prywatnym o charakterze hobbystycznym. Szanuję Twoją prywatność i nie gromadzę danych osobowych w celach marketingowych ani reklamowych. Poniżej znajdziesz informacje o tym, jak przetwarzane są Twoje dane w związku z funkcjonowaniem systemu kont i bezpieczeństwem serwera.
          </p>

          <section className="bg-bg-200 border border-bg-300 rounded-md p-6">
            <h2 className="text-xl font-bold text-text-900 mb-3 uppercase tracking-wide">1. Administrator Danych</h2>
            <p>
              Administratorem strony i danych jest osoba prywatna. W razie pytań lub chęci usunięcia konta, możesz skontaktować się pod adresem e-mail:{' '}
              <a href="mailto:admin@kkol.pl" className="font-bold text-accent-500 hover:text-accent-600 underline transition-colors">admin@kkol.pl</a>
            </p>
          </section>

          <section className="bg-bg-200 border border-bg-300 rounded-md p-6">
            <h2 className="text-xl font-bold text-text-900 mb-3 uppercase tracking-wide">2. Jakie dane zbieramy i w jakim celu?</h2>
            <p className="mb-4">Aby umożliwić Ci pełne korzystanie z serwisu (np. logowanie, personalizacja profilu), przetwarzamy następujące dane:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-text-900">Dane konta:</strong> Twój adres e-mail, zaszyfrowane hasło, wyświetlana nazwa oraz zdjęcie profilowe. Są one niezbędne do świadczenia usługi prowadzenia konta (art. 6 ust. 1 lit. b RODO).
              </li>
              <li>
                <strong className="text-text-900">Logi serwera:</strong> Twój adres IP, typ przeglądarki i systemu operacyjnego oraz czas zapytania. Dane te są niezbędne do diagnozowania błędów i zapewnienia bezpieczeństwa serwera (np. ochrona przed atakami). Podstawą przetwarzania jest prawnie uzasadniony interes administratora (art. 6 ust. 1 lit. f RODO).
              </li>
            </ul>
          </section>

          <section className="bg-bg-200 border border-bg-300 rounded-md p-6">
            <h2 className="text-xl font-bold text-text-900 mb-3 uppercase tracking-wide">3. Pliki Cookies (Ciasteczka)</h2>
            <p>
              Strona korzysta <strong className="text-text-900">wyłącznie z niezbędnych plików cookies</strong>. Używamy ciasteczka o nazwie <code className="bg-bg-300 px-1 py-0.5 rounded text-sm text-text-900 font-mono">auth_token</code>, które zawiera bezpieczny token (JWT) pozwalający utrzymać Twoją sesję po zalogowaniu. Ze względu na to, że jest to ciastko technicznie niezbędne do działania konta użytkownika, nie wymaga ono dodatkowej zgody (zgodnie z przepisami Prawa Telekomunikacyjnego). Nie używamy cookies śledzących ani reklamowych.
            </p>
          </section>

          <section className="bg-bg-200 border border-bg-300 rounded-md p-6">
            <h2 className="text-xl font-bold text-text-900 mb-3 uppercase tracking-wide">4. Infrastruktura i Przekazywanie Danych</h2>
            <p>
              Serwis jest hostowany na prywatnej infrastrukturze serwerowej. W celu zapewnienia najwyższego standardu bezpieczeństwa, szyfrowania połączenia (HTTPS) oraz ochrony przed atakami DDoS, ruch sieciowy jest kierowany przez serwery firmy <strong className="text-text-900">Cloudflare, Inc. (USA)</strong>. Cloudflare działa jako tarcza ochronna i posiada odpowiednie certyfikaty (Data Privacy Framework), co gwarantuje poziom ochrony zgodny z wymogami Unii Europejskiej.
            </p>
          </section>

          <section className="bg-bg-200 border border-bg-300 rounded-md p-6">
            <h2 className="text-xl font-bold text-text-900 mb-3 uppercase tracking-wide">5. Twoje Prawa</h2>
            <p className="mb-4">Zgodnie z przepisami RODO masz pełną kontrolę nad swoimi danymi. Przysługuje Ci prawo do:</p>
            <ul className="list-disc pl-6 space-y-2 mb-6">
              <li>Dostępu do swoich danych,</li>
              <li>Sprostowania danych (możesz samodzielnie zmienić nazwę i awatar w panelu konta),</li>
              <li>Usunięcia danych (tzw. "prawo do bycia zapomnianym"),</li>
              <li>Wniesienia sprzeciwu wobec przetwarzania.</li>
            </ul>
            <p>
              W celu realizacji tych praw skontaktuj się z administratorem za pomocą adresu e-mail:{' '}
              <a href="mailto:admin@kkol.pl" className="font-bold text-accent-500 hover:text-accent-600 underline transition-colors">admin@kkol.pl</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
