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

export async function requireAuth(redirect = true) {
    try {
        const response = await fetch('/api/me');
        
        if (!response.ok) {
            console.warn("User not authenticated. Redirecting to login...");
            if (redirect) {window.location.href = '/login'};
            return null;
        }

        const data = await response.json();
        return data.user; 
        
    } catch (error) {
        console.error("Authentication check failed:", error);
        if (redirect) {window.location.href = '/login'};
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
