import { loadData } from "/js/helpers.js";

let standings = [];

export default async function tableLoader(tournamentId) {

    //defining standing

    const tournamentData = await loadData(`/api/tournaments?id=${tournamentId}`);
    const tournament = tournamentData[tournamentId];
    const standings = tournament.standings;

    const playersData = await loadData(`/api/players`)
    
    const container = document.querySelector(".ranking_table tbody");

    standings.forEach(standing => {

        const playerId = standing.id;
        const player = playersData[playerId];
        const playerThisTournamentStats = player.tournaments[tournamentId];

        // playerThisTournamentStats.position and standing.positon is the same.
        const playerPosition = playerThisTournamentStats.position;
        const playerName = player.displayed_name;
        const playerTotalPoints = playerThisTournamentStats.total_points
        // All players should have the same amount of games_points entries. Even unattended game_points value is "-" not null.
        const gamesPoints = playerThisTournamentStats.games_points;

        const playerHTML = `
            <tr class="ranking_table_standard">
                <td class="ranking_table_position">${playerPosition}</td>
                <td class="ranking_player">${playerName}</td>
                ${
                    gamesPoints.map((gamePoints) => {
                        return (
                            `<td class="ranking_game_result">${gamePoints}</td>`
                        )
                    }).join('') // removes the comma (because the map return the array)
                }
                <td class="ranking_total">${playerTotalPoints}</td>
            </tr>
        `;

        container.insertAdjacentHTML('beforeend', playerHTML);

    });

    
};
