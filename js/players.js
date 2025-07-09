const path = window.location.pathname;
const playerID = path.split("/").pop();

async function loadData(url) {
  let response = await fetch(url);
  let data = await response.json();
  return data;
}

async function loadProfiles()
{

    const playerData = await loadData('/players.json');
    const player = playerData[playerID];
    const tournamentsData = await loadData('/tournaments.json');
    let tournaments = [];

    let attendedTournaments = Object.keys(player.tournaments);

    attendedTournaments.forEach(tournament => {
        tournaments.push( tournamentsData[tournament] )
    });

    // Sort tournaments by timestamp descending (newest first)
    tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

    function createTournamentDiv(tournament) {

        const seasonItem = document.createElement('div');
        seasonItem.classList.add('player_single_tournament');

        // Title
        const title = document.createElement('div');
        title.classList.add('player_single_tournament_title');
        title.style.backgroundColor = `#${tournament.details.theme_color}`;
        title.textContent = tournament.displayed_name;
        seasonItem.appendChild(title);

        // Stats container
        const stats = document.createElement('div');
        stats.classList.add('player_single_tournament_stats');
        stats.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url('/img/players/tournaments/bckg/${tournament.id}.webp')`;

        // Stats header
        const statsHeader = document.createElement('div');
        statsHeader.classList.add('player_single_tournament_stats_header');

        const position = document.createElement('div');
        position.classList.add('player_single_tournament_stats_position');
        position.textContent = `#${player.tournaments[tournament.id].position}`;

        statsHeader.appendChild(position);

        // Some games don't have pointing system.
        if(player.tournaments[tournament.id].games_points)
        {
            const points = document.createElement('div');
            points.classList.add('player_single_tournament_stats_points');

            const pointsNumber = document.createElement('div');
            pointsNumber.classList.add('player_single_tournament_stats_points_number');
            pointsNumber.textContent = `${player.tournaments[tournament.id].total_points}`;

            const pointsTitle = document.createElement('div');
            pointsTitle.classList.add('player_single_tournament_stats_points_title');
            pointsTitle.textContent = 'PKT';
            pointsTitle.style.color = `#${tournament.details.theme_color}`;

            points.appendChild(pointsNumber);
            points.appendChild(pointsTitle);

            statsHeader.appendChild(points);
        }

        // Stats details
        const statsDetails = document.createElement('div');
        statsDetails.classList.add('player_single_tournament_stats_details');

        const ul = document.createElement('ul');
        ul.style.color = `#${tournament.details.theme_color}`;

        const li1 = document.createElement('li');
        const img1 = document.createElement('img');
        img1.src = '/img/players/calendar_icon.webp';
        li1.appendChild(img1);
        li1.append(` ` + tournament.details.displayed_date);

        const li2 = document.createElement('li');
        const img2 = document.createElement('img');
        img2.src = '/img/players/profile_icon.webp';
        li2.appendChild(img2);
        li2.append(` ${tournament.details.players} graczy`);

        const li3 = document.createElement('li');
        const img3 = document.createElement('img');
        img3.src = '/img/players/trophy_icon.webp';
        li3.appendChild(img3);
        li3.append(` ${tournament.details.tier}-Tier`);

        ul.appendChild(li1);
        ul.appendChild(li2);
        ul.appendChild(li3);

        statsDetails.appendChild(ul);

        // Logo
        if (tournament.logo_exists)
        {
            const logoDiv = document.createElement('div');
            logoDiv.classList.add('player_single_tournament_stats_logo');
            const logoImg = document.createElement('img');
            logoImg.src = `/img/players/tournaments/logo/${tournament.id}.webp`;
            logoDiv.appendChild(logoImg);

            statsDetails.appendChild(logoDiv);
        }


        stats.appendChild(statsHeader);
        stats.appendChild(statsDetails);

        seasonItem.appendChild(stats);

        // Append to #torunament_major or #torunament_minor
        const container = document.getElementById(`tournament_${tournament.type}`);
        if (container) {
            container.appendChild(seasonItem);
        }

    }

    tournaments.forEach(tournament => {
        createTournamentDiv(tournament)
    });

}

loadProfiles()


// Example usage: create and append the tournament div
// createTournamentDiv();