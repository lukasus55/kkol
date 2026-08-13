"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import "../../public/css/2026.css";
import RankingTable from "../../components/ui/RankingTable";
import CompactCalendar from "../../components/ui/CompactCalendar";

interface GDPlayerStat {
  id: string;
  displayedName: string;
  totalPoints: number;
  allScores: number[];
}

const RANK_POINTS: Record<number, number> = { 1: 4, 2: 3, 3: 2, 4: 1 };

function AnimatedStatCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            const duration = Math.min(1000, Math.max(600, target * 200));
            let startTimestamp: number | null = null;
            const step = (timestamp: number) => {
              if (!startTimestamp) startTimestamp = timestamp;
              const progress = Math.min((timestamp - startTimestamp) / duration, 1);
              setCount(Math.floor(progress * target));
              if (progress < 1) {
                window.requestAnimationFrame(step);
              } else {
                setCount(target);
              }
            };
            window.requestAnimationFrame(step);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target, started]);

  return (
    <div ref={ref} className="single_stat">
      <div className="stat_value">{count}</div>
      <div className="stat_name">{label}</div>
    </div>
  );
}

export default function Page2026() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [cardModes, setCardModes] = useState<Record<string, boolean>>({});
  const [gdStats, setGdStats] = useState<GDPlayerStat[]>([]);
  const [gdLevels, setGdLevels] = useState<any[]>([]);

  useEffect(() => {
    // Scroll listener for header logo & title
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 1);
    };
    window.addEventListener("scroll", handleScroll);

    // Intersection Observers
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
        } else {
          entry.target.classList.remove("show");
        }
      });
    });

    const hiddenElements = document.querySelectorAll(".anim-hidden");
    hiddenElements.forEach((el) => observer.observe(el));

    const listObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < entry.target.children.length; i++) {
            entry.target.children[i].classList.add("showSingle");
          }
        } else {
          for (let i = 0; i < entry.target.children.length; i++) {
            entry.target.children[i].classList.remove("showSingle");
          }
        }
      });
    });

    const hiddenListElements = document.querySelectorAll(".hiddenList");
    hiddenListElements.forEach((el) => listObserver.observe(el));

    // Fetch Geometry Dash data
    async function loadGD() {
      try {
        const res = await fetch("/api/gd");
        const data = await res.json();
        if (data?.levels) {
          setGdLevels(data.levels);
          const calculatedStats = calculateGDStats(data.levels);
          setGdStats(calculatedStats);
        }
      } catch (e) {
        console.error("Failed to load GD data", e);
      }
    }
    loadGD();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      listObserver.disconnect();
    };
  }, []);

  function calculateGDStats(levels: any[]) {
    const playersCount = 4;
    const playersStats: GDPlayerStat[] = [
      { id: "kostys", displayedName: "Kostyś", totalPoints: 0, allScores: [] },
      { id: "damidami2", displayedName: "DamiDami2", totalPoints: 0, allScores: [] },
      { id: "harnas", displayedName: "Harnoldihno", totalPoints: 0, allScores: [] },
      { id: "kukula", displayedName: "Kukuła", totalPoints: 0, allScores: [] }
    ];

    levels.forEach((level) => {
      if (!level.finished) return;
      if (!level.players || level.players.length !== playersCount) return;

      const positionCounts: Record<number, number> = {};
      level.players.forEach((p: any) => {
        const pos = p.position;
        positionCounts[pos] = (positionCounts[pos] || 0) + 1;
      });

      const pointsForPosition: Record<number, number> = {};
      for (const [posStr, count] of Object.entries(positionCounts)) {
        const startRank = parseInt(posStr, 10);
        let sumPoints = 0;
        for (let i = 0; i < count; i++) {
          const currentRank = startRank + i;
          sumPoints += RANK_POINTS[currentRank] || 0;
        }
        pointsForPosition[startRank] = sumPoints / count;
      }

      for (let i = 0; i < playersCount; i++) {
        const playerInfo = level.players[i];
        const position = playerInfo.position;
        const score = parseInt(playerInfo.score, 10);
        const targetPlayer = playersStats.find((p) => p.id === playerInfo.id);

        if (targetPlayer) {
          if (pointsForPosition[position] !== undefined) {
            targetPlayer.totalPoints += pointsForPosition[position];
          }
          targetPlayer.allScores.push(score);
        }
      }
    });

    return [...playersStats].sort((a, b) => {
      if (a.totalPoints !== b.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      return a.displayedName.localeCompare(b.displayedName);
    });
  }

  const toggleCardMode = (cardId: string) => {
    setCardModes((prev) => ({
      ...prev,
      [cardId]: !prev[cardId]
    }));
  };

  const getPlayerCustomName = (rawId: string) => {
    if (rawId === "kukula") return "KUŁ";
    return rawId.substring(0, 3).toUpperCase();
  };

  return (
    <div className="season-2026">
      <nav className="navbar" id="navbar">
        <div className={`logo ${isScrolled ? "show-logo" : ""}`}>
          <Link href="/2026">
            <img src="/img/2026/SeasonLogoNoBackground.webp" alt="Logo 2026" />
          </Link>
        </div>

        <div className="buttons">
          <Link href="#schedule">
            <div className="single_button">
              <img src="/img/2026/ScheduleIcon.svg" alt="Kalendarz" />
              <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/ScheduleIcon.svg')" } as React.CSSProperties}></div>
              <span className="label"> Kalendarz </span>
            </div>
          </Link>

          <Link href="#ranking">
            <div className="single_button">
              <img src="/img/2026/RankingIcon.svg" alt="Ranking" />
              <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/RankingIcon.svg')" } as React.CSSProperties}></div>
              <span className="label"> Ranking </span>
            </div>
          </Link>

          <Link href="#games">
            <div className="single_button">
              <img src="/img/2026/GamesIcon.svg" alt="Gry" />
              <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GamesIcon.svg')" } as React.CSSProperties}></div>
              <span className="label"> Gry </span>
            </div>
          </Link>
        </div>
      </nav>

      <header className="header section_shadow" id="header">
        <div className="season_title">
          <div className={`season ${isScrolled ? "hide-season" : ""}`}>
            <div className="title">Karwińska Olimpiada</div>

            <div className="year">
              <div className="year_text" id="year_text">
                2026
              </div>
            </div>
          </div>
        </div>

        <div className="header_container">
          <div className="header_half">
            <div className="title"> W TYM SEZONIE </div>

            <div className="stats">
              <AnimatedStatCounter target={6} label="GIER" />
              <AnimatedStatCounter target={4} label="GRACZY" />
              <AnimatedStatCounter target={1} label="TYTUŁ" />
            </div>
          </div>

          <div className="header_half">
            <div className="games">
              <div className="learn_games"> Poznaj gry </div>
              <div className="buttons hiddenList">
                <Link href="#gd" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/GeometryIcon.webp" alt="GD" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GeometryIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> GD </span>
                  </div>
                </Link>

                <Link href="#golf" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/GolfIcon.webp" alt="Golf" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GolfIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> Golf </span>
                  </div>
                </Link>

                <Link href="#pociag" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/TrainIcon.webp" alt="Pociągi" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/TrainIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> Pociągi </span>
                  </div>
                </Link>

                <Link href="#pummel" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/PummelIcon.webp" alt="Pummel" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/PummelIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> Pummel </span>
                  </div>
                </Link>

                <Link href="#splendor" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/SplendorIcon.webp" alt="Splendor" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/SplendorIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> Splendor </span>
                  </div>
                </Link>

                <Link href="#dart" className="hiddenSingle">
                  <div className="single_wide_button">
                    <img src="/img/2026/DartIcon.webp" alt="Dart" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/DartIcon.webp')" } as React.CSSProperties}></div>
                    <span className="label"> Dart </span>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="main" id="main">
        <section className="schedule section_shadow" id="schedule">
          <CompactCalendar
            tournamentId="kol2026"
            primaryColorClass="text-[#72b01d]"
            textColorClass="text-white"
            secondaryTextColorClass="text-gray-400"
          />
        </section>

        <section className="ranking section_shadow" id="ranking">
          <div className="ranking_title">
            <span className="section_title"> RANKING </span>
          </div>

          <div className="ranking_table_segment">
            <RankingTable tournamentId="kol2026">
              <thead>
                <tr className="ranking_table_header">
                  <th className="ranking_position">#</th>
                  <th className="ranking_player_header">Gracz</th>
                  <th className="ranking_game ranking_game1_td">
                    <div className="ranking_game1" title="Geometry Dash">
                      <img src="/img/2026/GeometryIcon.webp" alt="Geometry Dash" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GeometryIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_game ranking_game2_td">
                    <div className="ranking_game2" title="Golf With Your Friends">
                      <img src="/img/2026/GolfIcon.webp" alt="Golf" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GolfIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_game ranking_game3_td">
                    <div className="ranking_game3" title="Wsiąść do Pociągu: Europa">
                      <img src="/img/2026/TrainIcon.webp" alt="Pociągi" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/TrainIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_game ranking_game4_td">
                    <div className="ranking_game4" title="Pummel Party">
                      <img src="/img/2026/PummelIcon.webp" alt="Pummel Party" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/PummelIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_game ranking_game5_td">
                    <div className="ranking_game5" title="Splendor">
                      <img src="/img/2026/SplendorIcon.webp" alt="Splendor" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/SplendorIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_game ranking_game6_td">
                    <div className="ranking_game6" title="Dart">
                      <img src="/img/2026/DartIcon.webp" alt="Dart" />
                      <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/DartIcon.webp')" } as React.CSSProperties}></div>
                    </div>
                  </th>
                  <th className="ranking_total_header">Total</th>
                </tr>
              </thead>
            </RankingTable>
          </div>
        </section>

        <section className="games_section" id="games">
          <div className="section_title">SZCZEGÓŁY GIER</div>

          <div className="games_grid">
            {/* Geometry Dash Card */}
            <div
              className={`game_card ${cardModes["gd"] ? "view-results" : ""}`}
              onClick={() => toggleCardMode("gd")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/GeometryIcon.webp" alt="GD Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GeometryIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Geometry Dash</h3>
                    <span className="subtitle"></span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["gd"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Rytmiczna gra platformowa wymagająca niezwykłej precyzji i pamięci mięśniowej. Gracze
                    rywalizują o ukończenie jak największej liczby poziomów o rosnącym stopniu trudności, gdzie
                    każdy błąd oznacza konieczność rozpoczęcia od nowa.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Ciągły
                    <br />
                    Data: 01.02.2026 - 16.04.2026
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Punkty</th>
                        <th className="text-right">Avg%</th>
                      </tr>
                    </thead>
                    <tbody id="gdcard_results">
                      {gdStats.map((p) => {
                        const avg =
                          p.allScores.length > 0
                            ? p.allScores.reduce((a, b) => a + b, 0) / p.allScores.length
                            : 0;
                        return (
                          <tr key={p.id}>
                            <td className="player_name">{p.displayedName}</td>
                            <td className="text-right highlight">{p.totalPoints.toFixed(1)}</td>
                            <td className="text-right">{avg.toFixed(2)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Golf Card */}
            <div
              className={`game_card ${cardModes["golf"] ? "view-results" : ""}`}
              id="golf"
              onClick={() => toggleCardMode("golf")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/GolfIcon.webp" alt="Golf Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/GolfIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Golf With Friends</h3>
                    <span className="subtitle"></span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["golf"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Szalona gra w minigolfa, w której prawa fizyki są często umowne. Rywalizacja toczy się na
                    zróżnicowanych tematycznie polach, a o wygranej decyduje liczba uderzeń oraz umiejętne
                    wykorzystanie power-upów.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Klasyczny
                    <br />
                    Data: 10.05.2026
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Wynik</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="player_name">Kukuła</td>
                        <td className="text-right highlight">12</td>
                      </tr>
                      <tr>
                        <td className="player_name">DamiDami2</td>
                        <td className="text-right highlight">8</td>
                      </tr>
                      <tr>
                        <td className="player_name">Kostyś</td>
                        <td className="text-right highlight">7</td>
                      </tr>
                      <tr>
                        <td className="player_name">Harnoldihno</td>
                        <td className="text-right highlight">2</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Train Card */}
            <div
              className={`game_card ${cardModes["pociag"] ? "view-results" : ""}`}
              id="pociag"
              onClick={() => toggleCardMode("pociag")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/TrainIcon.webp" alt="Train Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/TrainIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Wsiąść do Pociągu</h3>
                    <span className="subtitle">Europa</span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["pociag"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Strategiczna gra planszowa polegająca na budowaniu połączeń kolejowych między miastami
                    Europy. Kluczem do zwycięstwa jest realizacja tajnych biletów oraz blokowanie tras
                    przeciwników w najmniej oczekiwanym momencie.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Klasyczny
                    <br />
                    Data: 24.06.2026
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Punkty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="player_name">Kukuła</td>
                        <td className="text-right highlight">122</td>
                      </tr>
                      <tr>
                        <td className="player_name">Kostyś</td>
                        <td className="text-right highlight">108</td>
                      </tr>
                      <tr>
                        <td className="player_name">DamiDami2</td>
                        <td className="text-right highlight">87</td>
                      </tr>
                      <tr>
                        <td className="player_name">Harnoldihno</td>
                        <td className="text-right highlight">86</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Pummel Card */}
            <div
              className={`game_card ${cardModes["pummel"] ? "view-results" : ""}`}
              id="pummel"
              onClick={() => toggleCardMode("pummel")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/PummelIcon.webp" alt="Pummel Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/PummelIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Pummel Party</h3>
                    <span className="subtitle"></span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["pummel"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Brutalna mieszanka gry planszowej i zręcznościowych minigier. Gracze niszczą przyjaźnie
                    używając absurdalnego arsenału broni, starając się zdobyć jak najwięcej pucharów i przeżyć
                    na planszy.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Klasyczny
                    <br />
                    Data: 24.06.2026
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Puchary</th>
                        <th className="text-right">Minigry</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="player_name">Kostyś</td>
                        <td className="text-right highlight">6</td>
                        <td className="text-right">6</td>
                      </tr>
                      <tr>
                        <td className="player_name">Harnoldihno</td>
                        <td className="text-right highlight">4</td>
                        <td className="text-right">6</td>
                      </tr>
                      <tr>
                        <td className="player_name">DamiDami2</td>
                        <td className="text-right highlight">2</td>
                        <td className="text-right">4</td>
                      </tr>
                      <tr>
                        <td className="player_name">Kukuła</td>
                        <td className="text-right highlight">2</td>
                        <td className="text-right">5</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Splendor Card */}
            <div
              className={`game_card ${cardModes["splendor"] ? "view-results" : ""}`}
              id="splendor"
              onClick={() => toggleCardMode("splendor")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/SplendorIcon.webp" alt="Splendor Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/SplendorIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Splendor</h3>
                    <span className="subtitle"></span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["splendor"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Ekonomiczna gra karciana, w której gracze wcielają się w renesansowych kupców. Celem jest
                    zbieranie klejnotów, kupowanie kopalń i zdobywanie prestiżu, aby przyciągnąć uwagę
                    szlachty.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Klasyczny
                    <br />
                    Data: TBA
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Punkty</th>
                        <th className="text-right">Karty</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Dart Card */}
            <div
              className={`game_card ${cardModes["dart"] ? "view-results" : ""}`}
              onClick={() => toggleCardMode("dart")}
              style={{ cursor: "pointer" }}
            >
              <div className="card_header">
                <div className="header_left">
                  <div className="card_icon">
                    <img src="/img/2026/DartIcon.webp" alt="Dart Icon" />
                    <div className="icon-mask" style={{ "--icon-url": "url('/img/2026/DartIcon.webp')" } as React.CSSProperties}></div>
                  </div>
                  <div className="card_title">
                    <h3>Dart</h3>
                    <span className="subtitle">501 Double Out</span>
                  </div>
                </div>
                <div className="toggle_indicator">
                  <span className="indicator_text">{cardModes["dart"] ? "INFO" : "STATS"}</span>
                  <div className="indicator_icon">⇄</div>
                </div>
              </div>

              <div className="card_body">
                <div className="content_desc">
                  <p>
                    Klasyczna gra barowa przeniesiona na poziom turniejowy. Wymaga żelaznych nerwów i pewnej
                    ręki. Rywalizacja w formacie 501 Double Out, gdzie liczy się nie tylko celność, ale i
                    matematyka przy kończeniu lega.
                  </p>
                  <p className="highlight_text">
                    Format rozgrywki: Klasyczny
                    <br />
                    Data: TBA
                  </p>
                </div>
                <div className="content_stats">
                  <table className="game_table">
                    <thead>
                      <tr>
                        <th>Gracz</th>
                        <th className="text-right">Sety</th>
                        <th className="text-right">Średnia</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                      <tr>
                        <td className="player_name">-</td>
                        <td className="text-right highlight">-</td>
                        <td className="text-right">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="game_details" id="dart">
          <div className="section_title"> DART </div>
          <div className="laptop">
            <img src="/img/2026/DartesLaptop.png" alt="Laptop Dart" />
          </div>
          <div className="text">
            <div className="title">Kalkulator do darta</div>
            <div className="subtitle">Stworzony przez ES.company</div>
            <div className="button">
              <Link href="https://dart.kkol.pl" target="_blank">
                <div className="simple_button">
                  <span className="simple_button_text">Sprawdź</span>
                </div>
              </Link>
            </div>
          </div>
        </section>

        <section className="gd_container" id="gd">
          <div className="section_title"> GEOMETRY DASH </div>

          <div className="gd_card_container" id="gd_card_container">
            {gdLevels.map((level, id) => {
              const sortedPlayers = [...(level.players || [])].sort((a, b) => {
                if (a.position !== b.position) return a.position - b.position;
                return a.id.localeCompare(b.id);
              });

              return (
                <div key={id} className="gd_card" id={`gd_card_${id}`}>
                  <div className="gd_card_header">
                    <div className="icon">
                      <img
                        src={`/img/2026/GDDifficulties/${level.difficulty}.webp`}
                        alt={level.difficulty}
                      />
                    </div>
                    <div className="title">{level.name}</div>
                  </div>
                  <div className="gd_card_results">
                    {sortedPlayers.map((player: any, idx: number) => (
                      <div key={player.id} className="gd_card_player" id={`gd_player_${idx + 1}`}>
                        <div className="gd_player_position">#{player.position}</div>
                        <div className="gd_player_cube">
                          <img src={`/img/2026/GDCubes/${player.id}.webp`} alt={player.id} />
                        </div>
                        <div className="gd_player_name">{getPlayerCustomName(player.id)}</div>
                        <div className="gd_player_bar">
                          <div className="gd_progress_bar">
                            <div
                              className="gd_progress_fill"
                              style={{ width: `${player.score}%` }}
                            ></div>
                            <span className="gd_progress_text">{player.score}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
