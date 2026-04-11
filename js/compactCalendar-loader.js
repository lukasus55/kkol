import { loadData, appendLoaderDiv } from "/js/helpers.js";

export default async function compactCalendar(tournamentId) {
    if (!tournamentId) return;

    const container = document.getElementById(`schedule_table`);
    const loadingContainer = appendLoaderDiv(container);

    let events = await loadData(`/api/events?tournament=${tournamentId}`);

    container.removeChild(loadingContainer);

    // Sort events chronologically based on the start date
    events.sort((a, b) => new Date(a.start) - new Date(b.start));

    let eventHtml = '';

    events.forEach(e => {
        if (!e?.title || !e?.start) return;

        const dateObj = new Date(e.start);

        // Extract the short month in Polish (STY, LUT, MAJ...)
        const month = dateObj.toLocaleString('pl-PL', { month: 'short' }).toUpperCase();
        
        const day = ('0'+dateObj.getDate()).slice(-2)

        const formattedDate = `${day} ${month}`;

        eventHtml += `
            <div class="schedule_event ${e.extendedProps.is_major ? '' : 'minor'}">
                <div class="date">${formattedDate}</div>
                <div class="name">${e.title}</div>
            </div>
        `;
    });

    container.insertAdjacentHTML('beforeend', eventHtml);
}