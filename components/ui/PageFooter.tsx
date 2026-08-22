import Link from 'next/link';

export default function PageFooter() {
    return (
        <div className="w-full bg-bg-150 mt-20 pt-12 pb-12 px-6 flex flex-col items-center border-t border-b border-bg-300">
            <div className="w-full max-w-6xl flex flex-col sm:flex-row justify-between items-center sm:items-start gap-8">
                <div className="flex flex-col items-center sm:items-start gap-4">
                    <Link href="/">
                        <img src="/img/logos/kol-logo-horizontal.svg" alt="Karwińska Olimpiada" className="h-8 opacity-80 hover:opacity-100 transition-opacity" />
                    </Link>
                    <p className="text-text-500 text-sm text-center sm:text-left max-w-xs">
                        Oficjalna strona Karwińskiej Olimpiady. Śledź statystyki, turnieje i rankingi zawodników.
                    </p>
                </div>

                <div className="flex flex-col items-center sm:items-end gap-3 text-sm font-medium">
                    <Link href="/contact" className="text-text-500 hover:text-white transition-colors">
                        Kontakt
                    </Link>
                    <Link href="/privacy" className="text-text-500 hover:text-white transition-colors">
                        Polityka Prywatności
                    </Link>
                    <Link href="/more/api" target="_blank" rel="noopener noreferrer" className="text-text-500 hover:text-white transition-colors">
                        Dokumentacja API
                    </Link>
                    <Link href="https://www.youtube.com/@KarwińskaOlimpiada" target="_blank" rel="noopener noreferrer" className="text-text-500 hover:text-white transition-colors">
                        Youtube
                    </Link>
                </div>
            </div>

            <div className="w-full max-w-6xl h-px bg-bg-300 my-8" />

            <div className="text-text-500 text-xs text-center">
                {new Date().getFullYear()} Karwińska Olimpiada™. Wszelkie prawa zastrzeżone.
            </div>
        </div>
    );
}
