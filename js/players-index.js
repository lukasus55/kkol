import { calculateRanking } from "./helpers.js";

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
        const kkolRanking = player.ranking;

        const playerHTML = `
            <div class="player"> 
                <div class="name"> 
                    <a href="/players/${playerId}"> 
                        <img src="/img/players/pfp/${playerId}.webp"> ${playerName} 
                    </a> 
                </div>
                <div class="major"> ${majorRanking} </div>
                <div class="minor"> ${minorRanking} </div>
                <div class="ranking"> ${kkolRanking} </div>
            </div>
        `;

        // 'beforeend' puts it after the last child, but inside the container
        container.insertAdjacentHTML('beforeend', playerHTML);
    });
}

createLeaderboardDiv()