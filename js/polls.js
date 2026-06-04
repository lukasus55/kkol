import { formatRelativeTimePL } from "./utils/formatDate.js";
import { getParamsUrl, requireAuth } from "./utils/helpers.js";

(async () => {

    // Placeholder poll
    const poll = {
        end_date: "2026-06-04T13:19:00.000Z",
    }

    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `polls?${paramsUrl}`;

    // Authenticate user
    const userAuthenticated = await requireAuth(pageUrl);
    if (!userAuthenticated) return;

    // ====== HEADER ======
    const relativeEl = document.querySelector('#poll_date_relative');

    const relativeDate = formatRelativeTimePL(poll.end_date);
    const formattedDate = new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(poll.end_date));

    relativeEl.textContent = relativeDate;
    relativeEl.title = formattedDate;

})()
