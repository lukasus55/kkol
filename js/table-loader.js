import { loadData } from "/js/helpers.js";

let standings = [];

export default async function tableLoader(tournamentId) {

    //defining standings
    let tournamentsData = await loadData('/tournaments.json');

    let tournament = tournamentsData[tournamentId];

    let players_amount = Object.keys(tournament.standings).length
    for(let i = 0; i < players_amount; i++){
        standings.push( tournament.standings[i+1] );
    }

    //displaying tournaments
    let playersData = await loadData('/players.json');

    for(let i = 0; i < standings.length; i++){
        const player_id = standings[i];
        const player = playersData[player_id];

        const row = `#ranking_pos_${i+1} `;
        const td_position = document.querySelector(row + ".ranking_table_position");
        const td_name = document.querySelector(row + ".ranking_player");
        const td_games = document.querySelectorAll(row + ".ranking_game_result");
        const td_points = document.querySelector(row + ".ranking_total");

        let player_position = player.tournaments[tournamentId].position;
        td_position.textContent = player_position;
        td_name.textContent = player.displayed_name;
        td_points.textContent = player.tournaments[tournamentId].total_points;

        for(let game = 0; game < td_games.length; game++){
            td_games[game].textContent = player.tournaments[tournamentId].games_points[game];
        }

        if (player_position==1)
        {
            td_position.classList.add('ranking_table_first_position');
        }
        else if (player_position==2)
        {
            td_position.classList.add('ranking_table_second_position');
        }
        else if (player_position==3)
        {
            td_position.classList.add('ranking_table_third_position');
        }
        else if (player_position==4)
        {
            td_position.classList.add('ranking_table_fourth_position');
        }
            
    }
    
};
