import { loadData, appendLoaderDiv } from "./helpers.js";

async function createTournamentsDiv()
{
    const container = document.querySelector('.container');
    const loadingContainer = appendLoaderDiv(container);

    const [tournamentsData, players] = await Promise.all([
        loadData('/api/tournaments'),
        loadData('/api/players')
    ]);

    container.removeChild(loadingContainer);

    // Sort tournaments by timestamp descending (newest first)
    const tournaments = Object.values(tournamentsData).sort((a, b) => b.details.timestamp - a.details.timestamp);

    tournaments.forEach(tournament => {

        const tournamentName = tournament.displayed_name;
        const tournamentDate = tournament.details.displayed_date;
        const tournamentTier = tournament.details.tier;
        const isFinished = tournament.finished;

        const tournamentPageExists = tournament.page_exists;
        const tournamentPageUrl = tournamentPageExists ? tournament.page_url : '#';

        const winnerId = tournament.standings[0].id;
        const winner = players[winnerId];
        const winnerName = isFinished ? winner.displayed_name : `TBD`;

        const pfpSrc = isFinished ? (winner.pfp_base64 
            ? `data:image/webp;base64,${winner.pfp_base64}` 
            : '/img/default_pfp.webp') : ``;

        const cardHTML = `
            <div class="card"> 
                <div class="name"> 
                    ${tournamentPageExists ? `
                        <a href="/${tournamentPageUrl}"> ${tournamentName} </a>` 
                        : `${tournamentName}` 
                    }
                </div>
                <div class="tier"> ${tournamentTier}-Tier </div>
                <div class="date"> ${tournamentDate} </div>
                <div class="winner"> 
                    ${isFinished ? `
                        <img src="${pfpSrc}"><a href="/player?id=${winnerId}">${winnerName}</a>` 
                        : `TBD` 
                    }
                </div>
            </div>
        `;

        // 'beforeend' puts it after the last child, but inside the container
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

createTournamentsDiv()