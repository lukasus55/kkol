import Link from 'next/link';

export default function Footer() {
  return (
    <div className="footer_container">
      <div className="footer_bar">
        <Link href="/">
          <div className="footer_bar_button" title="Strona Główna">
            <img src="/img/home_icon.webp" alt="Strona Główna" />
          </div>
        </Link>
        <Link href="/events">
          <div className="footer_bar_button" title="Wydarzenia">
            <img src="/img/trophy_icon.webp" alt="Wydarzenia" />
          </div>
        </Link>
        <Link href="/2026">
          <div className="footer_bar_button" title="Sezon 2026">
            <img src="/img/season_icon.webp" alt="Sezon 2026" />
          </div>
        </Link>
        <Link href="/ranking">
          <div className="footer_bar_button" title="Ranking">
            <img src="/img/graph_icon.webp" alt="Ranking" />
          </div>
        </Link>
        <Link href="/dashboard">
          <div className="footer_bar_button" title="Profil">
            <img src="/img/profile_icon.webp" alt="Profil" />
          </div>
        </Link>
      </div>
    </div>
  );
}
