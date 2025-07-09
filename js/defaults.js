// Default values

const defaultTournamentThemeColor = '#ff0000';
const defaultTournamentDisplayDate = '2025-01-01';
const defaultTournamentPlayersCount = 0;
const defaultTournamentTier = "A";
const defaultTournamentType = "minor";
const defaultTournamentId = 0;
const defaultTournamentDisplayName = ""

export const defaultTournament = {
    details: {
        theme_color: defaultTournamentThemeColor,
        displayed_date: defaultTournamentDisplayDate,
        players: defaultTournamentPlayersCount,
        tier: defaultTournamentTier,
    },
    type: defaultTournamentType,
    id: defaultTournamentId,
    displayed_name: defaultTournamentDisplayName
}