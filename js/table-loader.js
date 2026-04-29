import { loadData } from "/js/helpers.js";

export default async function tableLoader(tournamentId) {

    //defining standing

    const table = document.querySelector(".ranking_table");
    const tableHead = document.querySelector(".ranking_table thead");
    const tableBody = document.querySelector(".ranking_table tbody");

    // Using custom loader instead of appendLoaderDiv() because the container div (.ranking_table) is table insted of regular div
    table.innerHTML = `<div class='loader loader-default'>`

    const [tournamentData, events] = await Promise.all([
        loadData(`/api/tournaments?id=${tournamentId}`),
        loadData(`/api/event_results?tournament=${tournamentId}&major=true`) // Only major events results should be displayed
    ]);

    const tournament = tournamentData[tournamentId];
    const tStandings = tournament.standings;

    console.log(tournament)
    console.log(tStandings)

    table.innerHTML = ``
    table.append(tableHead);
    table.append(tableBody)

    tStandings?.map(player => {

        const playerId = player.id;
        const playerPosition = player.position;
        const playerName = player.displayed_name;
        const playerTotalPoints = player.total_points;

        const playerHTML = `
            <tr class="ranking_table_standard">
                <td class="ranking_table_position">${playerPosition}</td>
                <td class="ranking_player">${playerName}</td>
                ${
                    events.map((event) => {
                        const map = new Map(event.results.map(p => [p.player_id, p]));
                        const playerThisEvent = map.get(playerId);

                        const playerThisEventScore = playerThisEvent.points === null ? '-' : Number.parseFloat(playerThisEvent.points).toFixed(0);
                        return (
                            `<td class="ranking_game_result">${playerThisEventScore}</td>`
                        )
                    }).join('') // removes the comma (because the map return the array)
                }
                <td class="ranking_total">${playerTotalPoints}</td>
            </tr>
        `;

        tableBody.insertAdjacentHTML('beforeend', playerHTML);

    });

    
};
