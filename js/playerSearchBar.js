import { getPfpSrc, loadData } from "./helpers.js";

// Debouncer - prevents spamming the API while the user is actively typing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function initPlayerSearchBar(containerSelector, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error(`Search Bar Error: Container ${containerSelector} not found.`);
        return;
    }

    const {
        mode = 'fill', // 'fill' (inserts ID into input) or 'auto' (fires callback immediately)
        onSelect = null, 
        placeholder = 'Wpisz nazwę lub ID gracza...'
    } = options;

    // Build the HTML Structure
    container.innerHTML = `
        <div class="search_bar_wrapper">
            <input type="text" class="search_bar_input" placeholder="${placeholder}" autocomplete="off">
            <div class="search_bar_dropdown hidden"></div>
        </div>
    `;

    const input = container.querySelector('.search_bar_input');
    const dropdown = container.querySelector('.search_bar_dropdown');

    // The Search Logic
    const performSearch = async (query) => {
        if (query.trim().length < 1) {
            dropdown.innerHTML = '';
            dropdown.classList.add('hidden');
            return;
        }

        try {
            const results = await loadData(`/api/search_players?q=${encodeURIComponent(query.trim())}`);
            
            if (!results || results.length === 0) {
                dropdown.innerHTML = `<div class="search_bar_empty">Brak wyników dla "${query}"</div>`;
                dropdown.classList.remove('hidden');
                return;
            }

            // Render the results
            dropdown.innerHTML = results.map(player => `
                <div class="search_bar_item" data-id="${player.id}">
                    <img src="${getPfpSrc(player.pfp_base64)}" class="search_bar_pfp" alt="Avatar">
                    <div class="search_bar_info">
                        <span class="search_bar_name">${player.displayed_name}</span>
                        <span class="search_bar_id">@${player.id}</span>
                    </div>
                </div>
            `).join('');
            
            dropdown.classList.remove('hidden');

        } catch (error) {
            console.error("Search failed:", error);
        }
    };

    // Attach Debounced Listener
    const debouncedSearch = debounce((e) => performSearch(e.target.value), 300);
    input.addEventListener('input', debouncedSearch);

    // Handle Clicks on Dropdown Items (Event Delegation)
    dropdown.addEventListener('click', (e) => {
        const item = e.target.closest('.search_bar_item');
        if (!item) return;

        const playerId = item.getAttribute('data-id');

        if (mode === 'fill') {
            input.value = playerId;
            dropdown.classList.add('hidden');
        } else if (mode === 'auto') {
            input.value = '';
            dropdown.classList.add('hidden');
            if (onSelect) onSelect(playerId);
        }
    });

    //  Close dropdown when clicking anywhere else on the screen
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
}