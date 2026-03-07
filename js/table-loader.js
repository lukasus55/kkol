import { loadData } from "/js/helpers.js";

export default async function tableLoader(tournamentId) {

    //defining standing

    const table = document.querySelector(".ranking_table");
    const tableHead = document.querySelector(".ranking_table thead");
    const tableBody = document.querySelector(".ranking_table tbody");

    // Using custom loader instead of appendLoaderDiv() because the container div (.ranking_table) is table insted of regular div
    table.innerHTML = `<div class='loader loader-default'>`

    const [tournamentData, playersData] = await Promise.all([
        loadData(`/api/tournaments?id=${tournamentId}`),
        loadData(`/api/players`)
    ]);
    const tournament = tournamentData[tournamentId];
    const standings = tournament.standings;

    table.innerHTML = ``
    table.append(tableHead);
    table.append(tableBody)

    standings?.forEach(standing => {

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

        tableBody.insertAdjacentHTML('beforeend', playerHTML);

    });

    
};
