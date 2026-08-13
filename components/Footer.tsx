import Link from 'next/link';
import { Home, Trophy, BarChart2, User } from 'lucide-react';

export default function Footer() {
  return (
    <div className="footer_container">
      <div className="footer_bar">
        <Link href="/">
          <div className="footer_bar_button" title="Strona Główna">
            <Home className="w-[1em] h-[1em] transition-colors" />
          </div>
        </Link>
        <Link href="/events">
          <div className="footer_bar_button" title="Wydarzenia">
            <Trophy className="w-[1em] h-[1em] transition-colors" />
          </div>
        </Link>
        <Link href="/2026">
          <div className="footer_bar_button" title="Sezon 2026">
            <img src="/img/season_icon.webp" alt="Sezon 2026" />
          </div>
        </Link>
        <Link href="/ranking">
          <div className="footer_bar_button" title="Ranking">
            <BarChart2 className="w-[1em] h-[1em] transition-colors" />
          </div>
        </Link>
        <Link href="/dashboard">
          <div className="footer_bar_button" title="Profil">
            <User className="w-[1em] h-[1em] transition-colors" />
          </div>
        </Link>
      </div>
    </div>
  );
}
