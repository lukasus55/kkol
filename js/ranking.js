import { appendLoaderDiv, loadData } from "./helpers.js";

// Display leaderboard
async function createLeaderboardDiv()
{
    const container = document.querySelector('.leaderboard');
    const loadingContainer = appendLoaderDiv(container);

    const leaderboardData = await loadData("/api/ranking");
    const leaderboard = Object.values(leaderboardData);
    leaderboard.sort((a,b) => b.ranking - a.ranking);

    container.removeChild(loadingContainer);

    leaderboard.forEach(player => {

        const playerName = player.name;
        const playerId = player.id;
        const majorRanking = player.majorRanking;
        const minorRanking = player.minorRanking;
        const kkolRanking = player.ranking;
        const pfpSrc = player.pfpSrc;

        const playerHTML = `
            <div class="player"> 
                <div class="name"> 
                    <a href="/player?id=${playerId}"> 
                        <img src="${pfpSrc}"> ${playerName} 
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