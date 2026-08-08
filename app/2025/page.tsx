"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "../../public/css/2025.css";
import RankingTable from "../../components/ui/RankingTable";

export default function Page2025() {
  const [championPfp, setChampionPfp] = useState("/img/default_pfp.webp");
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  useEffect(() => {
    // Fetch champion data
    async function loadChampion() {
      try {
        const res = await fetch("/api/players?id=kostys");
        const players = await res.json();
        const champion = players?.kostys;
        if (champion?.pfp_base64) {
          setChampionPfp(`data:image/webp;base64,${champion.pfp_base64}`);
        }
      } catch (e) {
        console.error("Failed to load champion pfp", e);
      }
    }
    loadChampion();

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

    // Champion Confetti
    const section = document.getElementById("championSection");
    const colors = ["#FFD700", "#C0C0C0", "#ffffff", "#B8860B"];

    function createConfetti() {
      if (!section) return;
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement("div");
        confetti.classList.add("confetti");
        confetti.style.left = Math.random() * 100 + "%";
        confetti.style.top = "-10px";
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.width = Math.random() * 10 + 5 + "px";
        confetti.style.height = Math.random() * 10 + 5 + "px";
        confetti.style.animationDuration = Math.random() * 3 + 2 + "s";
        confetti.style.animationDelay = Math.random() * 2 + "s";

        section.appendChild(confetti);

        setTimeout(() => {
          confetti.remove();
        }, 5000);
      }
    }

    const confettiObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          createConfetti();
        }
      });
    });

    if (section) {
      confettiObserver.observe(section);
    }

    return () => {
      observer.disconnect();
      listObserver.disconnect();
      if (section) confettiObserver.disconnect();
    };
  }, []);

  const handleOpenPopup = (game?: string) => {
    setIsPopupOpen(true);
    if (game) {
      setSelectedGame(game);
    } else {
      setSelectedGame(null);
    }
  };

  const handleToggleGame = (game: string) => {
    if (selectedGame === game) {
      setSelectedGame(null);
    } else {
      setSelectedGame(game);
    }
  };

  const getPopupTitle = () => {
    if (!selectedGame) return "";
    if (selectedGame === "brain") return "BRAIN SHOW";
    if (selectedGame === "pummel") return "PUMMEL PARTY";
    return selectedGame.toUpperCase();
  };

  const finishedGames = ["catan", "codenames", "brain"];

  return (
    <div className="season-2025">
      <header className="header" id="header">
        <div className="header_container">
          <div className="title">Karwińska Olimpiada</div>

          <div className="year">
            <div className="year_text" id="year_text">
              2025
            </div>
          </div>

          <section className="champion_section" id="championSection">
            <h3 className="champion_title">ZWYCIĘZCA</h3>

            <Link href="/players/kostys" className="champion_card">
              <img src={championPfp} className="champion_img" id="championPfp" alt="Kostyś" />
            </Link>

            <h1 className="champion_name">Kostyś</h1>
            <p className="champion_stats">12pkt. / 12pkt.</p>
          </section>
        </div>
      </header>

      <main className="main" id="main">
        <section className="ranking" id="ranking">
          <div className="ranking_title">
            <span className="main_title_text"> RANKING </span>
          </div>

          <div className="ranking_table_segment">
            <RankingTable tournamentId="kol2025">
              <thead>
                <tr className="ranking_table_header">
                  <th className="ranking_position" rowSpan={2}>
                    Poz.
                  </th>
                  <th className="ranking_player_header" rowSpan={2}>
                    Gracz
                  </th>
                  <th className="ranking_pts" colSpan={6}>
                    Punkty
                  </th>
                </tr>
                <tr className="ranking_table_games_icons">
                  <td
                    className="ranking_game ranking_game1_td ranking_game_clickable"
                    onClick={() => handleOpenPopup("catan")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="ranking_game1" title="Catan">
                      <img
                        src="/img/2025/games/catan-logo.webp"
                        alt="Hexagonalna mapa catana w czarno-białym wariancie"
                      />
                    </div>
                  </td>
                  <td
                    className="ranking_game ranking_game2_td ranking_game_clickable"
                    onClick={() => handleOpenPopup("codenames")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="ranking_game2" title="Codenames">
                      <img src="/img/2025/games/codenames-logo.webp" alt="Codenames" />
                    </div>
                  </td>
                  <td
                    className="ranking_game ranking_game4_td ranking_game_clickable"
                    onClick={() => handleOpenPopup("brain")}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="ranking_game3" title="Brain Show">
                      <img src="/img/2025/games/brain-show-logo.webp" alt="Brain Show" />
                    </div>
                  </td>
                  <th className="ranking_total_header">Total</th>
                </tr>
              </thead>
            </RankingTable>
          </div>

          <div className="ranking_button_section">
            <button className="ranking_details_button" onClick={() => handleOpenPopup()}>
              <div className="ranking_details_button_text"> Szczegóły </div>
            </button>
          </div>
        </section>

        {/* Results Popup */}
        <div
          className="results_popup"
          id="results_popup"
          style={{ display: isPopupOpen ? "flex" : "none" }}
        >
          <div
            className="results_container"
            id="results_container"
            style={{
              height: selectedGame ? "min(calc(100% - 150px), 25rem)" : "6.25rem",
              transition: "height 0.3s ease"
            }}
          >
            <div
              className="results_close_button"
              id="results_close_button"
              onClick={() => setIsPopupOpen(false)}
            >
              <img src="/img/close_tab_black.webp" className="results_close_button_icon" alt="Zamknij" />
            </div>

            {/* Game Results Details */}
            <div
              className="results_game"
              id="results_game"
              style={{ display: selectedGame ? "flex" : "none" }}
            >
              <div className="results_title" id="results_title">
                {getPopupTitle()}
              </div>
              <div className="results_box" id="results_box">
                {/* No results placeholder */}
                {selectedGame && !finishedGames.includes(selectedGame) && (
                  <div className="results_single_game" id="results_game_noResults" style={{ display: "flex" }}>
                    Ta gra się jeszcze nie odbyła.
                  </div>
                )}

                {/* Catan results */}
                {selectedGame === "catan" && (
                  <div
                    className="results_single_game results_game_catan"
                    id="results_game_catan"
                    style={{ display: "flex" }}
                  >
                    <table className="results_game_table">
                      <thead>
                        <tr>
                          <th rowSpan={2} className="results_game_position">
                            Poz.
                          </th>
                          <th rowSpan={2} className="results_game_player">
                            Gracz
                          </th>
                          <th colSpan={2} className="results_game_catan_round">
                            Runda 1
                          </th>
                          <th colSpan={2} className="results_game_catan_round">
                            Runda 2
                          </th>
                          <th colSpan={2} className="results_game_catan_round">
                            Total
                          </th>
                        </tr>
                        <tr>
                          <th className="results_game_catan_position" title="Punkty gry">
                            Pkt.
                          </th>
                          <th className="results_game_catan_vp" title="Victory Points">
                            VP
                          </th>
                          <th className="results_game_catan_position" title="Punkty gry">
                            Pkt.
                          </th>
                          <th className="results_game_catan_vp" title="Victory Points">
                            VP
                          </th>
                          <th className="results_game_catan_position" title="Punkty gry">
                            Pkt.
                          </th>
                          <th className="results_game_catan_vp" title="Victory Points">
                            VP
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td> 1 </td>
                          <td className="results_game_player_name"> DamiDami2 </td>
                          <td> 3 </td>
                          <td> 7 </td>
                          <td> 3 </td>
                          <td> 8 </td>
                          <td> 6 </td>
                          <td> 15 </td>
                        </tr>
                        <tr>
                          <td> 1 </td>
                          <td className="results_game_player_name"> Kostyś </td>
                          <td> 3 </td>
                          <td> 7 </td>
                          <td> 3 </td>
                          <td> 8 </td>
                          <td> 6 </td>
                          <td> 15 </td>
                        </tr>
                        <tr>
                          <td> 3 </td>
                          <td className="results_game_player_name"> Harnoldihno </td>
                          <td> 4 </td>
                          <td> 10 </td>
                          <td> 1 </td>
                          <td> 6 </td>
                          <td> 5 </td>
                          <td> 16 </td>
                        </tr>
                        <tr>
                          <td> 3 </td>
                          <td className="results_game_player_name"> Kukuła </td>
                          <td> 1 </td>
                          <td> 6 </td>
                          <td> 4 </td>
                          <td> 10 </td>
                          <td> 5 </td>
                          <td> 16 </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Codenames results */}
                {selectedGame === "codenames" && (
                  <div
                    className="results_single_game results_game_codenames"
                    id="results_game_codenames"
                    style={{ display: "flex" }}
                  >
                    <table className="results_game_table">
                      <thead>
                        <tr>
                          <th className="results_game_position"> Poz. </th>
                          <th className="results_game_player"> Gracz </th>
                          <th className="results_game_codenames_round"> R1 </th>
                          <th className="results_game_codenames_round"> R2 </th>
                          <th className="results_game_codenames_round"> R3 </th>
                          <th className="results_game_codenames_round"> R4 </th>
                          <th className="results_game_codenames_round"> R5 </th>
                          <th className="results_game_codenames_round"> R6 </th>
                          <th className="results_game_codenames_round"> R7 </th>
                          <th className="results_game_codenames_round"> R8 </th>
                          <th className="results_game_codenames_round"> R9 </th>
                          <th className="results_game_codenames_round"> Total </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td> 1 </td>
                          <td className="results_game_player_name"> Kostyś </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="win"> W </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td> 6 </td>
                        </tr>
                        <tr>
                          <td> 2 </td>
                          <td className="results_game_player_name"> DamiDami2 </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td> 4 </td>
                        </tr>
                        <tr>
                          <td> 2 </td>
                          <td className="results_game_player_name"> Harnoldihno </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="loss"> L </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td> 4 </td>
                        </tr>
                        <tr>
                          <td> 2 </td>
                          <td className="results_game_player_name"> Kukuła </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td className="loss"> L </td>
                          <td className="win"> W </td>
                          <td> 4 </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Brain Show results */}
                {selectedGame === "brain" && (
                  <div
                    className="results_single_game results_game_brain"
                    id="results_game_brain"
                    style={{ display: "flex" }}
                  >
                    <table className="results_game_table">
                      <thead>
                        <tr>
                          <th rowSpan={2} className="results_game_position">
                            Poz.
                          </th>
                          <th rowSpan={2} className="results_game_player">
                            Gracz
                          </th>
                          <th colSpan={6} className="results_game_position" title="Punkty gry">
                            Punkty
                          </th>
                        </tr>
                        <tr>
                          <th className="results_game_codenames_round"> R1 </th>
                          <th className="results_game_codenames_round"> R2 </th>
                          <th className="results_game_codenames_round"> R3 </th>
                          <th className="results_game_codenames_round"> R4 </th>
                          <th className="results_game_codenames_round"> R5 </th>
                          <th className="results_game_codenames_round"> Total </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td> 1 </td>
                          <td className="results_game_player_name"> Kostyś </td>
                          <td className="win"> 4 </td>
                          <td className="loss"> 4 </td>
                          <td className="win"> 2 </td>
                          <td className="loss"> 3 </td>
                          <td className="win"> 4 </td>
                          <td> 17 </td>
                        </tr>
                        <tr>
                          <td> 2 </td>
                          <td className="results_game_player_name"> DamiDami2 </td>
                          <td className="loss"> 3 </td>
                          <td className="win"> 2 </td>
                          <td className="loss"> 4 </td>
                          <td className="loss"> 2 </td>
                          <td className="win"> 1 </td>
                          <td> 12 </td>
                        </tr>
                        <tr>
                          <td> 3 </td>
                          <td className="results_game_player_name"> Harnoldihno </td>
                          <td className="win"> 2 </td>
                          <td className="loss"> 1 </td>
                          <td className="win"> 1 </td>
                          <td className="win"> 4 </td>
                          <td className="loss"> 3 </td>
                          <td> 11 </td>
                        </tr>
                        <tr>
                          <td> 4 </td>
                          <td className="results_game_player_name"> Kukuła </td>
                          <td className="loss"> 1 </td>
                          <td className="win"> 3 </td>
                          <td className="loss"> 3 </td>
                          <td className="win"> 1 </td>
                          <td className="loss"> 2 </td>
                          <td> 10 </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Choose Game Initial View */}
            <div
              className="results_choose_game"
              id="results_choose_game"
              style={{ display: !selectedGame ? "flex" : "none" }}
            >
              Wybierz grę
            </div>

            {/* Footer Game Selectors */}
            <div className="results_footer">
              <div className="results_footer_container">
                <div
                  className={`results_footer_container_single_game ${
                    selectedGame === "catan" ? "results_footer_container_single_game_active" : ""
                  }`}
                  title="Catan"
                  id="results_footer_catan"
                  onClick={() => handleToggleGame("catan")}
                  style={{ cursor: "pointer" }}
                >
                  <img src="/img/2025/games/catan-logo-black.webp" alt="Catan" />
                </div>
              </div>
              <div className="results_footer_container">
                <div
                  className={`results_footer_container_single_game ${
                    selectedGame === "codenames" ? "results_footer_container_single_game_active" : ""
                  }`}
                  title="Codenames"
                  id="results_footer_codenames"
                  onClick={() => handleToggleGame("codenames")}
                  style={{ cursor: "pointer" }}
                >
                  <img src="/img/2025/games/codenames-logo-black.webp" alt="Codenames" />
                </div>
              </div>
              <div className="results_footer_container">
                <div
                  className={`results_footer_container_single_game ${
                    selectedGame === "brain" ? "results_footer_container_single_game_active" : ""
                  }`}
                  title="Brain Show"
                  id="results_footer_brain"
                  onClick={() => handleToggleGame("brain")}
                  style={{ cursor: "pointer" }}
                >
                  <img src="/img/2025/games/brain-show-logo-black.webp" alt="Brain Show" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <section className="games" id="games">
          <div className="games_title">
            <span className="main_title_text"> KONKURENCJE </span>
          </div>
          <div className="games_list">
            <div className="games_single_game" id="catan">
              <div className="games_single_game_image">
                <img src="/img/2025/games/catan.webp" alt="Catan" />
              </div>
              <div className="games_single_game_details">
                <div className="games_single_game_title">Settlers of Catan</div>
                <div className="games_single_game_description">
                  Catan to strategiczna gra planszowa, w której gracze rywalizują o dominację na wyspie,
                  budując osady, drogi i miasta. Plansza składa się z heksagonalnych pól reprezentujących różne
                  surowce: drewno, glinę, zboże, owce i rudy. Gracze zdobywają surowce, handlują nimi i
                  rozwijają swoje osady, dążąc do uzyskania 10 punktów zwycięstwa.
                </div>
                <div className="games_single_game_results">
                  <Link href="https://www.catan.com/" target="_blank">
                    Zobacz więcej
                  </Link>
                </div>
              </div>
            </div>

            <div className="games_single_game_reversed" id="codenames">
              <div className="games_single_game_image_reversed">
                <img src="/img/2025/games/codenames.webp" alt="Codenames" />
              </div>
              <div className="games_single_game_details">
                <div className="games_single_game_title">Codenames</div>
                <div className="games_single_game_description">
                  Codenames to drużynowa gra słowna, w której gracze starają się odgadnąć hasła swojej drużyny na
                  podstawie wskazówek od mistrza szpiegów. Liczy się spryt, skojarzenia i unikanie zakazanych słów,
                  zwłaszcza tego jednego — zabójcy, który kończy grę.
                </div>
                <div className="games_single_game_results">
                  <Link href="https://codenames.game/" target="_blank">
                    Zagraj online
                  </Link>
                </div>
              </div>
            </div>

            <div className="games_single_game" id="brain">
              <div className="games_single_game_image">
                <img src="/img/2025/games/brain-show.webp" alt="Brain Show" />
              </div>
              <div className="games_single_game_details">
                <div className="games_single_game_title">Brain Show</div>
                <div className="games_single_game_description">
                  Brain Show to humorystyczna gra quizowa, w której gracze rywalizują w zwariowanym teleturnieju,
                  odpowiadając na pytania i eliminując przeciwników. Gra charakteryzuje się trybem, w którym może
                  brać udział do 8 osób, a jej format opiera się na dynamicznym przeplataniu różnych mini-gier.
                </div>
                <div className="games_single_game_results">
                  <Link
                    href="https://store.steampowered.com/app/2235150/Brain_Show_Party_Game/"
                    target="_blank"
                  >
                    Zobacz więcej
                  </Link>
                </div>
              </div>
            </div>

            <div className="games_single_game_reversed" id="tiebreaker">
              <div className="games_single_game_image_reversed">
                <img src="/img/2025/games/tiebreakers.webp" alt="Dogrywki" />
              </div>
              <div className="games_single_game_details">
                <div className="games_single_game_title">Dogrywki</div>
                <div className="games_single_game_description">
                  Dodatkowa runda w razie remisu na 1 miejscu. W przypadku dogrywki dwóch osób - gra w &quot;Wyższa
                  lub niższa&quot;. W przypadku dogrywki trzech lub czterech osób - gra w &quot;UNO&quot;. O zasadach
                  gier przeczytaj w regulaminie dogrywek.
                </div>
                <div className="games_single_game_results">
                  <Link href="#download"> Zobacz regulaminy </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="logos">
          <div className="logos_container anim-hidden">
            <div className="logos_single_logo">
              <img src="/img/logos/s25_logo_v2.webp" title="Logo sezonu 2025 Karwińskiej Olimpiady" alt="S25" />
            </div>
            <div className="logos_single_logo">
              <img src="/img/logos/kkol-white.webp" title="Logo Karwińskiego Komitetu Olimpijskiego" alt="KKOL" />
            </div>
            <div className="logos_single_logo">
              <img src="/img/logos/olympic-logo.webp" title="Logo Karwińskiej Olimpiady" alt="Olympic" />
            </div>
            <div className="logos_single_logo">
              <img src="/img/logos/es-logo.webp" title="Logo ES.company" alt="ES" />
            </div>
          </div>
        </section>

        <section className="catan_map" id="catan_map">
          <div className="catan_box">
            <div className="catan_left">
              <div className="catan_empty_space"></div>
              <div className="catan_title hiddenList">
                <span className="hiddenSingle">INTERAKTYWNA</span>
                <span className="hiddenSingle">MAPA</span>
                <span className="hiddenSingle">CATANA</span>
              </div>
              <div className="catan_details">
                <div className="catan_details_text">
                  Zapoznaj się z mapami na jakich rozgrywane będą rundy Catana za pomocą interaktywnej mapy. Sprawdź
                  szczegóły pól, wymaganą ilość oczek i procentowe szanse.
                </div>
              </div>
              <div className="catan_button_section">
                <Link href="/more/catan">
                  <button className="catan_button">ZOBACZ</button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="download" id="download">
          <div className="download_title">
            <span className="main_title_text"> Pliki do pobrania </span>
          </div>
          <div className="download_legend">
            <div className="download_legend_container">
              <div className="download_lengend_single_type">
                <div className="download_legend_rectangle download_legend_type_rules"></div>
                <div className="download_legend_text">Regulaminy</div>
              </div>
              <div className="download_lengend_single_type">
                <div className="download_legend_rectangle download_legend_type_results"></div>
                <div className="download_legend_text">Wyniki</div>
              </div>
              <div className="download_lengend_single_type">
                <div className="download_legend_rectangle download_legend_type_other"></div>
                <div className="download_legend_text">Inne</div>
              </div>
            </div>
          </div>
          <div className="download_container">
            <div className="download_single_file download_type_rules">
              <div className="download_single_file_icon" title="Dokument">
                <div className="download_single_file_icon_container">
                  <img src="/img/docs_icon.webp" alt="Dokument" />
                </div>
              </div>
              <div className="download_single_file_text">
                <div className="download_single_file_title"> Regulamin dogrywek </div>
                <div className="download_single_file_name"> s2025-dogrywki.pdf </div>
              </div>
              <div className="download_single_file_download" title="Pobierz">
                <Link href="/download/2025/s2025-dogrywki.pdf" download>
                  <img
                    className="download_single_file_download_icon"
                    src="/img/download_icon.webp"
                    alt="Pobierz"
                  />
                </Link>
              </div>
            </div>

            <div className="download_single_file download_type_rules">
              <div className="download_single_file_icon" title="Dokument">
                <div className="download_single_file_icon_container">
                  <img src="/img/docs_icon.webp" alt="Dokument" />
                </div>
              </div>
              <div className="download_single_file_text">
                <div className="download_single_file_title"> Zasady i format </div>
                <div className="download_single_file_name"> s2025-regulamin.pdf </div>
              </div>
              <div className="download_single_file_download" title="Pobierz">
                <Link href="/download/2025/s2025-regulamin.pdf" download>
                  <img
                    className="download_single_file_download_icon"
                    src="/img/download_icon.webp"
                    alt="Pobierz"
                  />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
