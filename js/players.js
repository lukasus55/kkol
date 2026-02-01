import { loadData } from "./helpers.js";

const path = window.location.pathname;
const playerID = path.split("/").pop();

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

    function createTournamentDiv(tournament) {

        if (!tournament) return;

        const playerTournamentData = playerTournaments[tournament.id] ?? {};

        const tournamentName = tournament.displayed_name;
        const tournamentDate = tournament.details.displayed_date;
        const tournamentTier = tournament.details.tier;
        const playerPosition = playerTournamentData.position;

        const winnerId = tournament.standings[1];
        const winnerName = `t`

        const cardHTML = `
            <div class="card"> 
                <div class="name"> ${tournamentName ?? '-'} </div>
                <div class="position"> #${playerPosition ?? ''} </div>
                <div class="tier"> ${tournamentTier ?? '?'}-Tier </div>
                <div class="date"> ${tournamentDate ?? '-'} </div>
            </div>
        `;

        const container = document.querySelector(`#player_tournaments`);
        // 'beforeend' puts it after the last child, but inside the container
        container.insertAdjacentHTML('beforeend', cardHTML);

    }

    console.log(tournaments)
    tournaments.forEach(tournament => {
        createTournamentDiv(tournament)
    });

}

loadProfiles()