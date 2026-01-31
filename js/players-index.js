import { loadData } from "./helpers.js";

// CALCULATE RANKING
async function calculateRanking()
{
    const tournaments = await loadData('/tournaments.json');
    const players = await loadData('/players.json');

    // CALCULATE RANKING
    const leaderboard = {};

    Object.values(players).forEach(player => {

        const playerId = player.id;
        const playerName = player.displayed_name;
        const attendedTournamentsId = Object.keys(player.tournaments);

        const attendedTournaments = attendedTournamentsId
            .map(id => tournaments[id])
            .filter(item => item !== undefined);

        attendedTournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

        const majorTournaments = attendedTournaments
        .filter(t => t.type === 'major' && t.finished)
        .slice(0, 2); // only 2 last major events are counted

        const minorTournaments = attendedTournaments
        .filter(t => t.type === 'minor' && t.finished)
        .slice(0, 3); // only 3 last minor events are counted

        let majorPoints = 0;
        let minorPoints = 0;

        majorTournaments.forEach(tournament => {
            if (tournament.standings[1] === playerId) { majorPoints += 15 };
            if (tournament.standings[2] === playerId) { majorPoints += 10 };
            if (tournament.standings[3] === playerId) { majorPoints += 5 };
        });

        minorTournaments.forEach(tournament => {
            if (tournament.standings[1] === playerId) { minorPoints += 7 };
            if (tournament.standings[2] === playerId) { minorPoints += 4 };
            if (tournament.standings[3] === playerId) { minorPoints += 1 };
        });

        const majorRanking = majorPoints/Math.max(majorTournaments.length, 1);
        const minorRanking = minorPoints/Math.max(minorTournaments.length, 1);

        const ranking = (majorRanking + minorRanking)

        leaderboard[playerId] = {
            id: playerId,
            name: playerName,
            majorRanking: majorRanking,
            minorRanking: minorRanking,
            ranking: ranking
        };
        
    });

    return leaderboard;

}

// Display leaderboard
async function createLeaderboardDiv()
{
    const leaderboardData = await calculateRanking();
    const leaderboard = Object.values(leaderboardData);
    leaderboard.sort((a,b) => b.ranking - a.ranking);

    const container = document.querySelector('.leaderboard');

    leaderboard.forEach(player => {

        const playerName = player.name;
        const playerId = player.id;
        const majorRanking = player.majorRanking;
        const minorRanking = player.minorRanking;
        const ranking = player.ranking;

        const playerHTML = `
            <div class="player"> 
                <div class="name"> 
                    <a href="/players/${playerId}"> 
                        <img src="/img/players/pfp/${playerId}.webp"> ${playerName} 
                    </a> 
                </div>
                <div class="major"> ${majorRanking} </div>
                <div class="minor"> ${minorRanking} </div>
                <div class="ranking"> ${ranking} </div>
            </div>
        `;

        // 'beforeend' puts it after the last child, but inside the container
        container.insertAdjacentHTML('beforeend', playerHTML);
    });
}

createLeaderboardDiv()