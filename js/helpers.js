export async function loadData(url) {
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

export async function loadHtml(url) {
    let response = await fetch(url);
    let html = await response.text();
    return html;
}

export async function calculateRanking()
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