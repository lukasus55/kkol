import { loadData } from "./helpers.js";

async function createTournamentsDiv()
{
    const container = document.querySelector('.container');

    const tournamentsData = await loadData('/tournaments.json');
    const players = await loadData('/players.json');

    // Sort tournaments by timestamp descending (newest first)
    const tournaments = Object.values(tournamentsData).sort((a, b) => b.details.timestamp - a.details.timestamp);

    tournaments.forEach(tournament => {

        const tournamentName = tournament.displayed_name;
        const tournamentDate = tournament.details.displayed_date;
        const tournamentTier = tournament.details.tier;
        const isFinished = tournament.finished;

        const winnerId = tournament.standings[1];
        const winnerName = isFinished ? players[winnerId].displayed_name : `TBD`;

        console.log(tournament)

        const cardHTML = `
            <div class="card"> 
                <div class="name"> ${tournamentName} </div>
                <div class="tier"> ${tournamentTier}-Tier </div>
                <div class="date"> ${tournamentDate} </div>
                <div class="winner"> 
                    ${isFinished ? `
                        <a href="/players/${winnerId}"> <img src="/img/players/pfp/${winnerId}.webp"> ${winnerName} </a>` 
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