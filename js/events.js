import { loadData, appendLoaderDiv } from "./utils/helpers.js";

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

        console.log(tournament);

        const tournamentName = tournament.displayed_name || '-';
        const tournamentDate = tournament.details.displayed_date || '-';
        const tournamentTier = tournament.details.tier || '-';
        const isFinished = tournament.finished || false;

        const tournamentPageExists = tournament.page_exists;
        const tournamentPageUrl = tournamentPageExists ? tournament.page_url : '#';

        let winnersHTML = `TBD`;

        if (isFinished && tournament.standings && tournament.standings.length > 0) {
            const topPosition = tournament.standings[0].position;
            
            // Filter all players who tied
            const winners = tournament.standings.filter(s => s.position === topPosition);

            winnersHTML = winners.map(standing => {
                const winnerId = standing.id;
                const winner = players[winnerId];
                
                const winnerName = winner?.displayed_name || standing.displayed_name;
                
                const pfpSrc = winner?.pfp_base64 
                    ? `data:image/webp;base64,${winner.pfp_base64}` 
                    : '/img/default_pfp.webp';

                return `<div class="winner"><img src="${pfpSrc}"><a href="/player?id=${winnerId}">${winnerName}</a></div>`;
            }).join('');
        }

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
                <div class="winners_container"> 
                    ${winnersHTML}
                </div>
            </div>
        `;

        // 'beforeend' puts it after the last child, but inside the container
        container.insertAdjacentHTML('beforeend', cardHTML);
    });
}

createTournamentsDiv();