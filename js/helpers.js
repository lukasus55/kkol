export async function loadData(url) {
    // When url starts with /api and the exact file doesn't exist the /api/[table].js is responsible for the fetch (using Dynamic Routes).
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
    const tournamentsData = await loadData('/api/tournaments');
    const players = await loadData('/api/players');

    const tournaments = Object.values(tournamentsData);

    // CALCULATE RANKING
    const leaderboard = {};

    tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

    const relevantMajors = tournaments
    .filter(t => t.type === 'major' && t.finished)
    .slice(0, 2); // only 2 last major events are counted

    const relevantMinors = tournaments
    .filter(t => t.type === 'minor' && t.finished)
    .slice(0, 3); // only 3 last minor events are counte

    const MAJOR_SCALE = [15, 10, 5];
    const MINOR_SCALE = [7, 4, 1];

    relevantMajors.forEach(t => t._pointsMap = calculateTournamentPoints(t.standings, MAJOR_SCALE));
    relevantMinors.forEach(t => t._pointsMap = calculateTournamentPoints(t.standings, MINOR_SCALE));

    console.log(relevantMajors)

    Object.values(players).forEach(player => {

        const playerId = player.id;
        const playerName = player.displayed_name;

        let majorPoints = 0;
        let minorPoints = 0;

        // If player isn't in the map (didn't play/score), they get 0
        relevantMajors.forEach(t => majorPoints += (t._pointsMap[player.id] || 0));
        relevantMinors.forEach(t => minorPoints += (t._pointsMap[player.id] || 0));

        const majorRanking = majorPoints/Math.max(relevantMajors.length, 1);
        const minorRanking = minorPoints/Math.max(relevantMinors.length, 1);

        const ranking = (majorRanking + minorRanking)

        leaderboard[playerId] = {
            id: playerId,
            name: playerName,
            majorRanking: majorRanking.toFixed(2), // storing every value as string what could possibly go wrong
            minorRanking: minorRanking.toFixed(2),
            ranking: ranking.toFixed(2)
        };
        
    });

    function calculateTournamentPoints(standings, pointScale) {
        const map = {};

        // Group players by their position
        const groups = {};
        standings.forEach(s => {
            if (!groups[s.position]) groups[s.position] = [];
            groups[s.position].push(s.id);
        });

        // Assign points based on available slots
        let currentRankSlot = 0;

        Object.keys(groups).sort((a, b) => a - b).forEach(position => {
            const tiedPlayers = groups[position];
            const count = tiedPlayers.length;
            
            // Sum up the points for the slots these players occupy
            let totalPointsPool = 0;
            for (let i = 0; i < count; i++) {
                // If they tie for 2nd, they take Slot 1 (10pts) and Slot 2 (5pt)
                totalPointsPool += pointScale[currentRankSlot + i] || 0;
            }
            
            // Divide points equally
            const pointsPerPlayer = totalPointsPool / count;
            
            tiedPlayers.forEach(id => {
                map[id] = pointsPerPlayer;
            });

            currentRankSlot += count;
        });

        return map;
    }

    return leaderboard;

}