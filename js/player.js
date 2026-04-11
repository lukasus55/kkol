import { calculateRanking, loadData, appendLoaderDiv } from "./helpers.js";

document.addEventListener('DOMContentLoaded', async () => {

    const urlParams = new URLSearchParams(window.location.search);
    let playerID = urlParams.get('id'); 

    let wonTournamentsByTier = { s: [], a: [], b: [], c: [] };

    loadProfiles();
    loadStats();

    async function loadProfiles() {
        const container = document.querySelector('#player_tournaments');
        const loader = appendLoaderDiv(container, 'tournaments');

        const [tournamentsData, playerData] = await Promise.all([
            loadData('/api/tournaments'),
            loadData('/api/players')
        ]);

        if(!playerData[playerID]) {
            console.error("Player not found");
            window.location.replace('ranking');
        }

        const player = playerData[playerID] ?? {};

        loadHeader(player)

        const playerTournaments = player.tournaments ?? {};
        let attendedTournaments = Object.keys(playerTournaments);
        let tournaments = [];

        attendedTournaments.forEach(tournamentId => {
            if (tournamentsData[tournamentId]) {
                tournaments.push(tournamentsData[tournamentId]);
            }
        });

        // Sort tournaments descending
        tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

        // Populate won tournaments for the badges
        attendedTournaments.forEach(tournamentId => {
            const t = tournamentsData[tournamentId];
            const pData = playerTournaments[tournamentId] ?? {};

            if (pData.position === 1 && t.finished === true && t) {
                const tier = (t.details.tier || '').toLowerCase();
                if (wonTournamentsByTier[tier]) {
                    wonTournamentsByTier[tier].push(t.displayed_name);
                }
            }
        });

        container.removeChild(loader);

        // Render UI
        renderBadges();
        renderTournaments(tournaments, playerTournaments, container);
    }

    async function loadHeader(player) {
        if (!player) return;
        const nameEl = document.querySelector('.player_banner_name');
        const bannerEl = document.querySelector('.player_banner');
        const pfpSrc = player.pfp_base64 
            ? `data:image/webp;base64,${player.pfp_base64}` 
            : '/img/default_pfp.webp';

        if(!nameEl || !bannerEl) return;

        nameEl.textContent = player.displayed_name
        bannerEl.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url(${pfpSrc})`;
    }

    async function loadStats() {
        const container = document.querySelector('#stats');
        if (!container) return;

        const loader = appendLoaderDiv(container, 'stats');

        const leaderboard = await calculateRanking();
        container.removeChild(loader);

        const playerRanking = leaderboard[playerID] || { majorRanking: 0, minorRanking: 0, ranking: 0 };

        const cardHTML = `
            <div class="stats_single_stat">
                <div class="single_stat_name"> Ranking KKOL </div>
                <div class="single_stat_value"> ${playerRanking.ranking} </div>
            </div>
            <div class="stats_single_stat">
                <div class="single_stat_name"> S-Score </div>
                <div class="single_stat_value"> ${playerRanking.majorRanking} </div>
            </div>
            <div class="stats_single_stat">
                <div class="single_stat_name"> AB-Score </div>
                <div class="single_stat_value"> ${playerRanking.minorRanking} </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', cardHTML);
    }

    function renderTournaments(tournaments, playerTournaments, container) {
        if (!container) return;

        // Build all the HTML as a single string first (much better for performance)
        let allCardsHTML = '';

        if (!tournaments || tournaments.length === 0) {
            allCardsHTML = '<span class="no_tournaments_found"> Brak przypisanych turniejów </span>';
        }

        tournaments.forEach(tournament => {
            if (!tournament) return;

            const isTournamentFinished = tournament.finished;
            const playerTournamentData = playerTournaments[tournament.id] ?? {};

            const tournamentName = tournament.displayed_name;
            const tournamentDate = tournament.details.displayed_date;
            const tournamentTier = tournament.details.tier;
            const playerPosition = playerTournamentData.position;

            const tournamentPageExists = tournament.page_exists;
            const tournamentPageUrl = tournamentPageExists ? tournament.page_url : '#';

            allCardsHTML += `
                <div class="card"> 
                    <div class="name"> 
                        ${tournamentPageExists ? `
                            <a href="/${tournamentPageUrl}"> ${tournamentName} </a>`
                    : `${tournamentName}`
                } 
                    </div>
                    <div class="position"> ${playerPosition && isTournamentFinished ? `#${playerPosition}` : `-`} </div>
                    <div class="tier"> ${tournamentTier ?? '?'}-Tier </div>
                    <div class="date"> ${tournamentDate ?? '-'} </div>
                </div>
            `;
        });

        // Inject everything into the DOM at once
        container.insertAdjacentHTML('beforeend', allCardsHTML);
    }

    function renderBadges() {
        const badgeContainer = document.querySelector('.player_banner_badges');
        if (!badgeContainer) return;

        badgeContainer.innerHTML = ''; // Clear previous

        const tiers = ['s', 'a', 'b', 'c'];

        tiers.forEach(tier => {
            if (wonTournamentsByTier[tier].length > 0) {
                const badge = document.createElement('div');
                badge.className = `player_banner_single_badge banner_${tier}-tier`;
                badge.onclick = () => switchDetails(tier);
                badge.textContent = `${wonTournamentsByTier[tier].length}x ${tier.toUpperCase()}-Tier`;
                badgeContainer.appendChild(badge);
            }
        });
    }

    // Animations
    function switchDetails(tier) {
        const list = document.querySelector(".player_details");
        const scroller = list?.querySelector('.player_details_scroller');
        if (!list) return;

        if (list.classList.contains("visible") && list.classList.contains(`${tier.toLowerCase()}-tier`)) {
            list.classList.replace("visible", "hidden");
        } else {
            list.classList.replace("hidden", "visible");
            list.classList.remove("s-tier", "a-tier", "b-tier", "c-tier");
            list.classList.add(`${tier.toLowerCase()}-tier`);

            if (scroller) {
                scroller.innerHTML = '';
                const tierKey = tier.toLowerCase();
                const tournaments = wonTournamentsByTier[tierKey] || [];

                if (tournaments.length === 0) {
                    scroller.innerHTML = '<div class="player_details_tournament">Brak wygranych turniejów</div>';
                } else {
                    tournaments.forEach(name => {
                        const div = document.createElement('div');
                        div.className = 'player_details_tournament';
                        div.textContent = name;
                        scroller.appendChild(div);
                    });
                }
                setupScrollerAnimation(scroller);
            }
        }
    }

    function setupScrollerAnimation(scroller) {
        if (!scroller) return;
        const oldInner = scroller.querySelector('.player_details_scroller_inner');
        if (oldInner) {
            while (oldInner.firstChild) {
                scroller.appendChild(oldInner.firstChild);
            }
            oldInner.remove();
        }

        const items = Array.from(scroller.children);
        let inner = document.createElement('div');
        inner.className = 'player_details_scroller_inner';
        items.forEach(item => inner.appendChild(item));
        scroller.appendChild(inner);

        function updateScroller() {
            const scrollerWidth = scroller.clientWidth;
            const innerWidth = inner.scrollWidth;
            const distance = Math.max(0, innerWidth - scrollerWidth);
            if (distance > 0) {
                inner.style.setProperty('--scroll-distance', distance + 'px');
                inner.style.animationPlayState = 'running';
            } else {
                inner.style.animationPlayState = 'paused';
                inner.style.transform = 'translateX(0)';
                inner.style.removeProperty('--scroll-distance');
            }
        }
        window.addEventListener('resize', updateScroller);
        updateScroller();
    }

})