export async function loadData(url) 
{
    // When url starts with /api and the exact file doesn't exist the /api/[table].js is responsible for the fetch (using Dynamic Routes).
    let response = await fetch(url);
    let data = await response.json();
    return data;
}

export async function loadHtml(url) 
{
    let response = await fetch(url);
    let html = await response.text();
    return html;
}

// Use "const loadingContainer = appendLoaderDiv(container, optionalId);" before fetch
// Use "container.removeChild(loadingContainer);" after fetch
// Container Modes: deafult, global
export function appendLoaderDiv(container, containerMode='default') 
{
    const loadingContainer = document.createElement('div');
    loadingContainer.className = `loader loader-${containerMode}`;
    loadingContainer.id = `loader-${containerMode}`;
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = `loader_spinner`;

    loadingContainer.append(loadingSpinner);
    container.append(loadingContainer);

    return loadingContainer;
}

export async function requireAuth(destination = 'dashboard', redirect = true) {

    // Encoding to replace & symbols, so the login page treat them as polls paramaters and not login page params. Example:
    // login?polls?p=t&x=4 (browser would treat x=4 as separate param) ---> login?polls%3Fp%3Dt%26x%3D4
    const encodedDestination = encodeURIComponent(destination);

    try {
        const response = await fetch('/api/me');
        
        if (!response.ok) {
            console.warn("User not authenticated. Redirecting to login...");
            if (redirect) {window.location.href = `/login?r=${encodedDestination}`};
            return null;
        }

        const data = await response.json();
        return data.user; 
        
    } catch (error) {
        console.error("Authentication check failed:", error);
        if (redirect) {window.location.href = `/login?r=${encodedDestination}`};
        return null;
    }
}

export function createLogoutButton(logoutBtn, container, redirect = true) {

    if (logoutBtn && container) {
        logoutBtn.addEventListener('click', async () => {

            const loadingContainer = appendLoaderDiv(container, 'global')

            try {
                
                // Tell the server to destroy the cookie
                const response = await fetch('/api/logout', {
                    method: 'POST'
                });

                if (response.ok) {
                    // Redirect them to the login page
                    console.log("Logged out successfully");
                    if (redirect) {window.location.href = '/login'};
                } else {
                    console.error("Failed to log out");
                }
            } catch (error) {
                console.error("Network error during logout:", error);
            }

            if (!redirect) {container.removeChild(loadingContainer)};
        });
    }
}
export function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
export function capitalizeFirstLetter(val) {
    if (!val) return;
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}

export function getPfpSrc(base64) {
    if (typeof base64 === 'undefined' || base64 === null) {
        return '/img/default_pfp.webp'
    } else {
        return `data:image/webp;base64,${base64}`
    }
}

// format dates for HTML inputs (YYYY-MM-DDTHH:MM)
export function formatForDateTimeInput(input) {
    if (!input) return '';

    const dateObj = typeof input === 'string' ? new Date(input) : input;

    if (!(dateObj instanceof Date) || isNaN(dateObj)) return '';

    // Adjusts for local timezone offset before slicing
    const tzOffset = dateObj.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
    
    return localISOTime;
}

export function getParamsUrl(params) {
    let url = '';
    for (const [key, value] of params){
        url+=`${key}=${value}&`
    }
    return url;
}

export function adjustModalPosition(modal) {
    if (!modal) return;
    modal.style.left = '0';
    modal.style.transform = 'none';

    const rect = modal.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    
    const edgeBuffer = 16; 

    if (rect.right > viewportWidth - edgeBuffer) {
        const shiftAmount = rect.right - viewportWidth + edgeBuffer;
        modal.style.transform = `translateX(-${shiftAmount}px)`;
    }

    if (rect.left < edgeBuffer) {
        const shiftAmount = edgeBuffer - rect.left;
        modal.style.transform = `translateX(${shiftAmount}px)`;
    }
}

/** 
    * Discards operations that occur too close together during a specific interval,
    * @param {() => void} func - Function to be executed once in a specified time interval,
    * @param {number} wait - Time interval in milliseconds
    * @return {() => void} Function with delay
**/
export function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}