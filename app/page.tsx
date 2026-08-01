import Link from 'next/link';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <header>
        <div className="spacer"></div>
        <div className="title">
          <div className="title_top">KARWIŃSKA</div>
          <div className="title_bot">OLIMPIADA</div>
        </div>
        <div className="buttons">
          <div className="buttons_grid">
            <Link href="#about">
              <div className="button_standard">
                <img src="/img/about_icon.webp" alt="" />
                <span className="button_standard_text">O nas</span>
              </div>
            </Link>
            <Link href="#events">
              <div className="button_standard">
                <img src="/img/trophy_icon.webp" alt="" />
                <span className="button_standard_text">Wydarzenia</span>
              </div>
            </Link>
            <Link href="#tools">
              <div className="button_standard">
                <img src="/img/tools_icon.webp" alt="" />
                <span className="button_standard_text">Narzędzia</span>
              </div>
            </Link>
          </div>
        </div>
        <div className="spacer"></div>
      </header>

      <main>
        <section className="about" id="about">
          <div className="title">O NAS</div>
          <div className="about_container">
            <span className="about_name">Karwińska Olimpiada</span> to coroczne wydarzenie podczas którego stała grupa czterech uczestników rywalizuje w różnorodnych konkurencjach, takich jak gry planszowe, gry komputerowe, bilard, minigolf itp. W tym roku odbędzie się trzecia edycja tego turnieju.
          </div>
        </section>

        <section className="events" id="events">
          <div className="title">WYDARZENIA</div>
          <div className="cards_container">
            <div className="event_card">
              <div className="event_text">
                <div className="event_title">Karwińska Olimpiada 2026</div>
                <div className="event_details">
                  <div className="event_winner_title">Wygrany:</div>
                  <div className="event_winner_name">TBD</div>
                </div>
              </div>
              <div className="event_photo">
                <div className="event_buttons">
                  <Link href="/2026">
                    <div className="button_event">
                      <span className="button_event_text">Zobacz więcej</span>
                    </div>
                  </Link>
                </div>
                <img src="/img/home/events/kol2026.webp" alt="" />
              </div>
            </div>

            <div className="event_card">
              <div className="event_text">
                <div className="event_title">Karwińska Olimpiada 2025</div>
                <div className="event_details">
                  <div className="event_winner_title">Wygrany:</div>
                  <div className="event_winner_name"><Link href="/players/kostys">Kostyś</Link></div>
                </div>
              </div>
              <div className="event_photo">
                <div className="event_buttons">
                  <Link href="/2025">
                    <div className="button_event">
                      <span className="button_event_text">Zobacz więcej</span>
                    </div>
                  </Link>
                </div>
                <img src="/img/home/events/kol2025.webp" alt="" />
              </div>
            </div>

            <div className="event_card">
              <div className="event_text">
                <div className="event_title">Karwińska Olimpiada 2024</div>
                <div className="event_details">
                  <div className="event_winner_title">Wygrany:</div>
                  <div className="event_winner_name"><Link href="/players/harnas">Harnoldihno</Link></div>
                </div>
              </div>
              <div className="event_photo">
                <div className="event_buttons">
                  <Link href="/2024">
                    <div className="button_event">
                      <span className="button_event_text">Zobacz więcej</span>
                    </div>
                  </Link>
                </div>
                <img src="/img/home/events/kol2024.webp" alt="" />
              </div>
            </div>

            <div className="event_spacer"></div>
            <div className="events_see_all">
              <Link href="/events">
                <div className="button_standard">
                  <span className="button_standard_text">Zobacz wszystkie</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="tools" id="tools">
          <div className="title">NARZĘDZIA</div>
          <div className="tools_subtitle">
            Stworzone przez&nbsp;<span className="tools_highlit">KKOL</span>
          </div>
          <div className="tools_container">
            <a href="https://dart.kkol.pl">
              <div className="tools_card">
                <div className="tools_card_logo">
                  <img src="/img/home/tools/dart.webp" alt="" />
                </div>
                <div className="tools_card_name">Kalkulator do darta</div>
                <div className="tools_card_details">
                  Śledź wynik rozgrywki, możliwe checkouty, szczegółowe statystyki i więcej.
                </div>
              </div>
            </a>
            <Link href="/more/catan">
              <div className="tools_card">
                <div className="tools_card_logo">
                  <img src="/img/home/tools/catan.webp" alt="" />
                </div>
                <div className="tools_card_name">Interaktywna mapa Catana</div>
                <div className="tools_card_details">
                  Sprawdź szczegóły pól, wymaganą ilość oczek i procentowe szanse.
                </div>
              </div>
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="home_footer">
          <div className="home_footer_container">
            <Link href="/contact">Kontakt</Link>
            <Link href="/privacy">Polityka Prywatności</Link>
            <Link href="/more/api">Dokumentacja API</Link>
            <a href="https://www.youtube.com/@KarwińskaOlimpiada" target="_blank" rel="noreferrer">Youtube</a>
          </div>
        </div>
        <Footer />
      </footer>
    </>
  );
}
