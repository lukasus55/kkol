// Default values

const defaultTournamentThemeColor = '#ffffff';
const defaultTournamentDisplayDate = '-';
const defaultTournamentPlayersCount = 0;
const defaultTournamentTier = "A";
const defaultTournamentType = "minor";
const defaultTournamentId = "default";
const defaultTournamentDisplayName = ""

const defaultTournament = {
    details: {
        theme_color: defaultTournamentThemeColor,
        displayed_date: defaultTournamentDisplayDate,
        players: defaultTournamentPlayersCount,
        tier: defaultTournamentTier,
    },
    type: defaultTournamentType,
    id: defaultTournamentId,
    displayed_name: defaultTournamentDisplayName
}

//

const path = window.location.pathname;
const playerID = path.split("/").pop();

async function loadData(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}


function switchDetails(tier)
{
    const list = document.querySelector(".player_details");
    const scroller = list?.querySelector('.player_details_scroller');
    if (list.classList.contains("visible") && list.classList.contains(`${tier.toLowerCase()}-tier`))
    {
        list.classList.remove("visible");
        list.classList.add("hidden");
    }
    else
    {
        list.classList.remove("hidden");
        list.classList.add("visible");

        list.classList.remove("s-tier");
        list.classList.remove("a-tier");
        list.classList.remove("b-tier");

        switch(tier.toLowerCase())
        {
            case "s":
                list.classList.add("s-tier");
                break;
            case "a":
                list.classList.add("a-tier");
                break;
            case "b":
                list.classList.add("b-tier");
                break;
            default:
        }

        // Fill .player_details_scroller with won tournaments for this tier
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

// Scroller animation helpers
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

let wonTournamentsByTier = {
    s: [],
    a: [],
    b: []
};

async function loadProfiles()
{

    const playerData = await loadData('/players.json');
    const player = playerData[playerID] ?? {};
    const playerTournaments = player.tournaments ?? {};
    const tournamentsData = await loadData('/tournaments.json');
    let tournaments = [];

    let attendedTournaments = Object.keys(player.tournaments);

    attendedTournaments.forEach(tournament => {
        tournaments.push( tournamentsData[tournament] )
    });

    // Sort tournaments by timestamp descending (newest first)
    tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);
    
    let tournamentWons =
    {
        sTier: 0,
        aTier: 0,
        bTier: 0
    }

    // Count tournament wins per tier and collect names
    attendedTournaments.forEach(tournamentId => {
        const t = tournamentsData[tournamentId];
        const playerTournamentData = playerTournaments[tournamentId] ?? {};
        if (playerTournamentData.position === 1 && playerTournamentData.finished === true) {
            const tier = (t.details.tier || '').toLowerCase();
            switch (tier) {
                case 's':
                    wonTournamentsByTier.s.push(t.displayed_name);
                    break;
                case 'a':
                    wonTournamentsByTier.a.push(t.displayed_name);
                    break;
                case 'b':
                    wonTournamentsByTier.b.push(t.displayed_name);
                    break;
            }
        }
    });

    // Badge
    const badgeContainer = document.querySelector('.player_banner_badges');
    if (badgeContainer) {
        badgeContainer.innerHTML = '';
        if (wonTournamentsByTier.s.length > 0) {
            const sBadge = document.createElement('div');
            sBadge.className = 'player_banner_single_badge banner_s-tier';
            sBadge.onclick = () => switchDetails('s');
            sBadge.textContent = `${wonTournamentsByTier.s.length}x S-Tier`;
            badgeContainer.appendChild(sBadge);
        }
        if (wonTournamentsByTier.a.length > 0) {
            const aBadge = document.createElement('div');
            aBadge.className = 'player_banner_single_badge banner_a-tier';
            aBadge.onclick = () => switchDetails('a');
            aBadge.textContent = `${wonTournamentsByTier.a.length}x A-Tier`;
            badgeContainer.appendChild(aBadge);
        }
        if (wonTournamentsByTier.b.length > 0) {
            const bBadge = document.createElement('div');
            bBadge.className = 'player_banner_single_badge banner_b-tier';
            bBadge.onclick = () => switchDetails('b');
            bBadge.textContent = `${wonTournamentsByTier.b.length}x B-Tier`;
            badgeContainer.appendChild(bBadge);
        }
    }

    function createTournamentDiv(tournament = defaultTournament) {

        const seasonItem = document.createElement('div');
        seasonItem.classList.add('player_single_tournament');

        const tournamentDetails = tournament.details;
        const playerTournamentData = playerTournaments[tournament.id] ?? {};
        
        // Title
        const title = document.createElement('div');
        title.classList.add('player_single_tournament_title');
        title.style.backgroundColor = `${tournamentDetails.theme_color}`;
        title.textContent = tournament.displayed_name;
        seasonItem.appendChild(title);

        // Stats container
        const stats = document.createElement('div');
        stats.classList.add('player_single_tournament_stats');
        stats.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/img/players/tournaments/bckg/${tournament.id}.webp')`;

        // Stats header
        const statsHeader = document.createElement('div');
        statsHeader.classList.add('player_single_tournament_stats_header');

        const position = document.createElement('div');
        position.classList.add('player_single_tournament_stats_position');
        position.textContent = `#${playerTournamentData.position ?? ``}`;

        statsHeader.appendChild(position);

        // Some games don't have pointing system.
        if(playerTournamentData.games_points)
        {
            const points = document.createElement('div');
            points.classList.add('player_single_tournament_stats_points');

            const pointsNumber = document.createElement('div');
            pointsNumber.classList.add('player_single_tournament_stats_points_number');
            pointsNumber.textContent = `${playerTournamentData.total_points ?? 0}`;

            const pointsTitle = document.createElement('div');
            pointsTitle.classList.add('player_single_tournament_stats_points_title');
            pointsTitle.textContent = 'PKT';
            pointsTitle.style.color = `${tournamentDetails.theme_color}`;

            points.appendChild(pointsNumber);
            points.appendChild(pointsTitle);

            statsHeader.appendChild(points);
        }

        // Stats details
        const statsDetails = document.createElement('div');
        statsDetails.classList.add('player_single_tournament_stats_details');

        const ul = document.createElement('ul');
        ul.style.color = `${tournamentDetails.theme_color}`;

        const li1 = document.createElement('li');
        const img1 = document.createElement('img');
        img1.src = '/img/players/calendar_icon.webp';
        li1.appendChild(img1);
        li1.append(` ` + tournamentDetails.displayed_date);

        const li2 = document.createElement('li');
        const img2 = document.createElement('img');
        img2.src = '/img/players/profile_icon.webp';
        li2.appendChild(img2);
        li2.append(` ${tournamentDetails.players} graczy`);

        const li3 = document.createElement('li');
        const img3 = document.createElement('img');
        img3.src = '/img/players/trophy_icon.webp';
        li3.appendChild(img3);
        li3.append(` ${tournamentDetails.tier}-Tier`);

        ul.appendChild(li1);
        ul.appendChild(li2);
        ul.appendChild(li3);

        statsDetails.appendChild(ul);

        // Logo
        if (tournament.logo_exists)
        {
            const logoDiv = document.createElement('div');
            logoDiv.classList.add('player_single_tournament_stats_logo');
            const logoImg = document.createElement('img');
            logoImg.src = `/img/players/tournaments/logo/${tournament.id}.webp`;
            logoDiv.appendChild(logoImg);

            statsDetails.appendChild(logoDiv);
        }


        stats.appendChild(statsHeader);
        stats.appendChild(statsDetails);

        seasonItem.appendChild(stats);

        // Append to #torunament_major or #torunament_minor
        const container = document.getElementById(`tournament_${tournament.type}`);
        if (container) {
            container.appendChild(seasonItem);
        }

    }

    tournaments.forEach(tournament => {
        createTournamentDiv(tournament)
    });

}

loadProfiles()