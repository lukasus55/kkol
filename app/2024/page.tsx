"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import "../../public/css/2024.css";
import RankingTable from "../../components/ui/RankingTable";

export default function Page2024() {
  const [podiumPfps, setPodiumPfps] = useState({
    first: "/img/default_pfp.webp",
    second: "/img/default_pfp.webp",
    third: "/img/default_pfp.webp"
  });

  const [animStage, setAnimStage] = useState(0);
  const [isRankingPopupOpen, setIsRankingPopupOpen] = useState(false);
  const [isGame4PopupOpen, setIsGame4PopupOpen] = useState(false);
  const [activeGame, setActiveGame] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check mobile screen
    const checkMobile = () => {
      const w = window.innerWidth > 0 ? window.innerWidth : screen.width;
      setIsMobile(w <= 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Fetch players for podium
    async function loadPlayers() {
      try {
        const res = await fetch("/api/players?tournament=kol2024");
        const players = await res.json();
        setPodiumPfps({
          first: players?.harnas?.pfp_base64 ? `data:image/webp;base64,${players.harnas.pfp_base64}` : "/img/default_pfp.webp",
          second: players?.kostys?.pfp_base64 ? `data:image/webp;base64,${players.kostys.pfp_base64}` : "/img/default_pfp.webp",
          third: players?.kukula?.pfp_base64 ? `data:image/webp;base64,${players.kukula.pfp_base64}` : "/img/default_pfp.webp"
        });
      } catch (e) {
        console.error("Failed to load 2024 players", e);
      }
    }
    loadPlayers();

    // Intersection observers
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

    runPodiumAnimation();

    return () => {
      window.removeEventListener("resize", checkMobile);
      observer.disconnect();
      listObserver.disconnect();
    };
  }, []);

  const runPodiumAnimation = () => {
    setAnimStage(0);
    setTimeout(() => setAnimStage(1), 500);
    setTimeout(() => setAnimStage(2), 1000);
    setTimeout(() => setAnimStage(3), 1500);
    setTimeout(() => setAnimStage(4), 2000);
    setTimeout(() => setAnimStage(5), 2500);
    setTimeout(() => setAnimStage(6), 3000);
  };

  const getResultsHeight = () => {
    switch (activeGame) {
      case 1:
        return "18.75rem";
      case 2:
        return "31.25rem";
      case 3:
        return "34.375rem";
      case 4:
        return isMobile ? "18.75rem" : "50rem";
      default:
        return "18.75rem";
    }
  };

  const getResultsTitle = () => {
    switch (activeGame) {
      case 1:
        return "Minigolf";
      case 2:
        return "Monopoly";
      case 3:
        return "Bilard";
      case 4:
        return "Kinect";
      default:
        return "";
    }
  };

  return (
    <div className="season-2024">
      <header className="header" id="header">
        <div className="header_container">
          <div className="title">Karwińska Olimpiada</div>

          <div className="year">
            <div className="year_text" id="year_text">
              2024
            </div>
          </div>

          <div className="podium">
            {/* 2nd Place */}
            <div className="place">
              <div
                className="platform_second"
                id="platform_second"
                style={{
                  opacity: animStage >= 3 ? 1 : 0,
                  transform: animStage >= 3 ? "translateY(0)" : "translateY(50px)",
                  transition: "all 0.5s"
                }}
              >
                <div className="platform_inside number_second">2</div>
              </div>
              <div
                className="player_second"
                id="player_second"
                style={{
                  opacity: animStage >= 4 ? 1 : 0,
                  transition: "opacity 0.5s"
                }}
              >
                <div className="player_icon">
                  <img src={podiumPfps.second} className="player_border_second" alt="Kostyś" />
                </div>
                <div className="player_name">Kostyś</div>
              </div>
            </div>

            {/* 1st Place */}
            <div className="place">
              <div
                className="platform_first"
                id="platform_first"
                style={{
                  opacity: animStage >= 5 ? 1 : 0,
                  transform: animStage >= 5 ? "translateY(0)" : "translateY(50px)",
                  transition: "all 0.5s"
                }}
              >
                <div className="platform_inside number_first">1</div>
              </div>
              <div
                className="player_first"
                id="player_first"
                style={{
                  opacity: animStage >= 6 ? 1 : 0,
                  transition: "opacity 0.5s"
                }}
              >
                <div className="player_icon">
                  <img src={podiumPfps.first} className="player_border_first" alt="Harnoldihno" />
                </div>
                <div className="player_name">Harnoldihno</div>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="place">
              <div
                className="platform_third"
                id="platform_third"
                style={{
                  opacity: animStage >= 1 ? 1 : 0,
                  transform: animStage >= 1 ? "translateY(0)" : "translateY(50px)",
                  transition: "all 0.5s"
                }}
              >
                <div className="platform_inside number_third">3</div>
              </div>
              <div
                className="player_third"
                id="player_third"
                style={{
                  opacity: animStage >= 2 ? 1 : 0,
                  transition: "opacity 0.5s"
                }}
              >
                <div className="player_icon">
                  <img src={podiumPfps.third} className="player_border_third" alt="Kukuła" />
                </div>
                <div className="player_name">Kukuła</div>
              </div>
            </div>
          </div>

          <div className="buttons">
            <Link href="#ranking">
              <input
                className="play_again_button"
                id="play_again_button"
                type="button"
                value="Zobacz szczegóły"
                style={{
                  opacity: animStage >= 6 ? 1 : 0,
                  cursor: animStage >= 6 ? "pointer" : "not-allowed"
                }}
                disabled={animStage < 6}
                onClick={runPodiumAnimation}
              />
            </Link>
          </div>
        </div>
      </header>

      <main className="main" id="main">
        <section className="ranking" id="ranking">
          <div className="ranking_title">Wyniki</div>

          <div className="ranking_table_segment">
            <RankingTable tournamentId="kol2024">
              <thead>
                <tr className="ranking_table_header">
                  <th className="ranking_position" rowSpan={2}>
                    Pos.
                  </th>
                  <th className="ranking_player_header" rowSpan={2}>
                    Gracz
                  </th>
                  <th className="ranking_pts" colSpan={5}>
                    Punkty
                  </th>
                </tr>
                <tr className="ranking_table_standard">
                  <td className="ranking_game ranking_game1_td">
                    <Link href="#games" onClick={() => setActiveGame(1)}>
                      <div className="ranking_game1">
                        <img src="/img/2024/games/golf.webp" alt="Minigolf" />
                      </div>
                    </Link>
                  </td>
                  <td className="ranking_game ranking_game2_td">
                    <Link href="#games" onClick={() => setActiveGame(2)}>
                      <div className="ranking_game2">
                        <img src="/img/2024/games/monopoly.webp" alt="Monopoly" />
                      </div>
                    </Link>
                  </td>
                  <td className="ranking_game ranking_game3_td">
                    <Link href="#games" onClick={() => setActiveGame(3)}>
                      <div className="ranking_game3">
                        <img src="/img/2024/games/pool.webp" alt="Bilard" />
                      </div>
                    </Link>
                  </td>
                  <td className="ranking_game ranking_game4_td">
                    <Link href="#games" onClick={() => setActiveGame(4)}>
                      <div className="ranking_game4">
                        <img src="/img/2024/games/xbox.webp" alt="Kinect" />
                      </div>
                    </Link>
                  </td>
                  <th className="ranking_total_header">Total</th>
                </tr>
              </thead>
            </RankingTable>
          </div>

          {/* Popup */}
          <div
            className="ranking_popup"
            id="ranking_popup"
            style={{ display: isRankingPopupOpen ? "flex" : "none" }}
          >
            <div className="ranking_popup_container">
              <div className="ranking_popup_header">
                <div className="ranking_popup_title">PUNKTACJA</div>
                <div
                  className="ranking_popup_close_tab"
                  id="ranking_popup_close_tab"
                  onClick={() => setIsRankingPopupOpen(false)}
                >
                  <img src="/img/close_tab.webp" className="close_tab" alt="Zamknij" />
                </div>
              </div>

              <div className="ranking_popup_line"></div>
              <div className="ranking_popup_subtitle">Minigolf, monopoly, bilard</div>
              <div className="ranking_popup_points">
                <p> 1 miejsce: 4pkt </p>
                <p> 2 miejsce: 3pkt</p>
                <p> 3 miejsce: 2pkt</p>
                <p> 4 miejsce: 1pkt</p>
              </div>

              <div className="ranking_popup_subline"></div>
              <div className="ranking_popup_subtitle">7-bój kinectowy</div>
              <div className="ranking_popup_points">
                <p> 1 miejsce: 8pkt </p>
                <p> 2 miejsce: 6pkt</p>
                <p> 3 miejsce: 4pkt</p>
                <p> 4 miejsce: 2pkt</p>
              </div>
            </div>
          </div>

          <div className="ranking_description">
            <div
              className="ranking_button"
              id="ranking_button"
              onClick={() => setIsRankingPopupOpen(true)}
            >
              Wyświetl punktację
            </div>
          </div>
        </section>

        <section className="games" id="games">
          <div className="games_selector">
            <div className="selector_photo">
              <img
                src="/img/2024/games/golf_photo.webp"
                alt="Pole do gry w minigolfa"
                className="game1"
                style={{ opacity: activeGame === 1 ? 1 : 0.5, cursor: "pointer" }}
                onClick={() => setActiveGame(1)}
              />
            </div>

            <div className="selector_photo">
              <img
                src="/img/2024/games/monopoly_photo.webp"
                alt="Logo monopoly"
                className="game2"
                style={{ opacity: activeGame === 2 ? 1 : 0.5, cursor: "pointer" }}
                onClick={() => setActiveGame(2)}
              />
            </div>

            <div className="selector_photo">
              <img
                src="/img/2024/games/pool_photo.webp"
                alt="Bile na stole do bilarda"
                className="game3"
                style={{ opacity: activeGame === 3 ? 1 : 0.5, cursor: "pointer" }}
                onClick={() => setActiveGame(3)}
              />
            </div>

            <div className="selector_photo">
              <img
                src="/img/2024/games/xbox_photo.webp"
                alt="Zdjęcie z gry Xbox 360 Kinect Sports 1"
                className="game4"
                style={{ opacity: activeGame === 4 ? 1 : 0.5, cursor: "pointer" }}
                onClick={() => setActiveGame(4)}
              />
            </div>
          </div>

          <div
            className="games_results"
            id="games_results"
            style={{ height: getResultsHeight(), transition: "height 0.3s ease" }}
          >
            <div className="results_title" id="results_title">
              <span className="results_title_content" id="results_title_content">
                {getResultsTitle()}
              </span>
            </div>

            <div className="results_details">
              {/* Game 1: Minigolf */}
              <div
                className="results_game1"
                style={{ display: activeGame === 1 ? "flex" : "none", opacity: activeGame === 1 ? 1 : 0 }}
              >
                <div className="game1_details">
                  <div className="game1_no_details_icon">
                    <img src="/img/err404.webp" alt="Brak szczegółów" />
                  </div>
                  <div className="game1_no_details_text">Brak szczegółów dla tej gry.</div>
                </div>
              </div>

              {/* Game 2: Monopoly */}
              <div
                className="results_game2"
                style={{ display: activeGame === 2 ? "flex" : "none", opacity: activeGame === 2 ? 1 : 0 }}
              >
                <div className="game2_subgame_container">
                  <div className="game2_subgames">
                    <div className="game2_subgames_icon">
                      <img src="/img/2024/games/monopoly_fortnite1.webp" alt="Fortnite 1" />
                    </div>
                    <div className="game2_subgames_winner">Wygrany: Kostyś</div>
                  </div>
                  <div className="game2_subgames">
                    <div className="game2_subgames_icon">
                      <img src="/img/2024/games/monopoly_fortnite2.webp" alt="Fortnite 2" />
                    </div>
                    <div className="game2_subgames_winner">Wygrany: Kukuła</div>
                  </div>
                  <div className="game2_subgames">
                    <div className="game2_subgames_icon">
                      <img src="/img/2024/games/monopoly_ub.webp" alt="Ultimate Banking" />
                    </div>
                    <div className="game2_subgames_winner">Wygrany: DamiDami2</div>
                  </div>
                  <div className="game2_subgames">
                    <div className="game2_subgames_icon">
                      <img src="/img/2024/games/monopoly_cheaters.webp" alt="Cheaters Edition" />
                    </div>
                    <div className="game2_subgames_winner">Wygrany: Harnoldihno</div>
                  </div>
                </div>
              </div>

              {/* Game 3: Bilard */}
              <div
                className="results_game3"
                style={{ display: activeGame === 3 ? "flex" : "none", opacity: activeGame === 3 ? 1 : 0 }}
              >
                <div className="game3_group_stage">
                  <div className="game3_group_stage_title">Faza grupowa</div>
                  <div className="game3_group_stage_table">
                    <table className="group_table">
                      <thead>
                        <tr className="group_table_header">
                          <th className="group_table_position_header">Pos.</th>
                          <th className="group_table_player">Gracz</th>
                          <th className="group_table_pts_header">Bilans</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="group_table_standard">
                          <td className="group_table_position">1.</td>
                          <td className="group_table_player_name">Kukuła</td>
                          <td className="group_table_pts">3-0</td>
                        </tr>
                        <tr className="group_table_standard">
                          <td className="group_table_position">2.</td>
                          <td className="group_table_player_name">Harnoldihno</td>
                          <td className="group_table_pts">2-1</td>
                        </tr>
                        <tr className="group_table_standard">
                          <td className="group_table_position">3.</td>
                          <td className="group_table_player_name">Kostyś</td>
                          <td className="group_table_pts">1-2</td>
                        </tr>
                        <tr className="group_table_standard">
                          <td className="group_table_position">4.</td>
                          <td className="group_table_player_name">DamiDami2</td>
                          <td className="group_table_pts">0-3</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="game3_group_stage_results">
                    <table className="group_results">
                      <tbody>
                        <tr>
                          <td className="group_results_left">Kostyś</td>
                          <td className="group_results_score">1-0</td>
                          <td className="group_results_right">DamiDami2</td>
                        </tr>
                        <tr>
                          <td className="group_results_left">Harnoldihno</td>
                          <td className="group_results_score">0-1</td>
                          <td className="group_results_right">Kukuła</td>
                        </tr>
                        <tr className="group_results_round_end">
                          <td className="group_results_left">Kostyś</td>
                          <td className="group_results_score">0-1</td>
                          <td className="group_results_right">Harnoldihno</td>
                        </tr>
                        <tr>
                          <td className="group_results_left">Kukuła</td>
                          <td className="group_results_score">1-0</td>
                          <td className="group_results_right">DamiDami2</td>
                        </tr>
                        <tr className="group_results_round_end">
                          <td className="group_results_left">Harnoldihno</td>
                          <td className="group_results_score">1-0</td>
                          <td className="group_results_right">DamiDami2</td>
                        </tr>
                        <tr>
                          <td className="group_results_left">Kukuła</td>
                          <td className="group_results_score">1-0</td>
                          <td className="group_results_right">Kostyś</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="game3_knockout_stage">
                  <div className="game3_knockout_stage_title">Faza pucharowa</div>
                  <div className="game3_knockout_stage_matches">
                    <div className="game3_knockout_stage_final">
                      <div className="game3_match_title">Finał</div>
                      <div className="game3_match_results">
                        <table className="group_results knockout_results">
                          <tbody>
                            <tr>
                              <td className="knockout_result">Kukuła</td>
                              <td className="group_results_score">0-1</td>
                              <td className="knockout_result">Harnoldihno</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <div className="game3_knockout_stage_mini_final">
                      <div className="game3_match_title">Mecz o 3 miejsce</div>
                      <div className="game3_match_results">
                        <table className="group_results knockout_results">
                          <tbody>
                            <tr>
                              <td className="knockout_result">Kostyś</td>
                              <td className="group_results_score">1-0</td>
                              <td className="knockout_result">DamiDami2</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Game 4: Kinect */}
              <div
                className="results_game4"
                style={{ display: activeGame === 4 ? "flex" : "none", opacity: activeGame === 4 ? 1 : 0 }}
              >
                {!isMobile && (
                  <div className="game4_results_image_container" id="game4_results_image_container">
                    <img
                      src="/img/2024/games/xbox_results.webp"
                      className="game4_image"
                      id="game4_image"
                      alt="Wyniki Kinect"
                      style={{ cursor: "pointer" }}
                      onClick={() => setIsGame4PopupOpen(true)}
                    />
                  </div>
                )}
                {isMobile && (
                  <div className="game4_results_text_container" id="game4_results_text_container">
                    <ul className="game4_results_text_line">
                      <Link href="/img/2024/games/xbox_results.webp" target="_blank" download>
                        Pobierz wyniki w formacie .webp
                      </Link>
                    </ul>
                  </div>
                )}
              </div>

              {/* Game 4 Popup */}
              <div
                className="game4_popup"
                id="game4_popup"
                style={{ display: isGame4PopupOpen ? "flex" : "none" }}
                onClick={() => setIsGame4PopupOpen(false)}
              >
                <div className="game4_popup_container">
                  <img
                    src="/img/2024/games/xbox_results.webp"
                    className="game4_poup_image"
                    alt="Wyniki Kinect Pełny Ekran"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
