import { requireAuth } from "./helpers.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const user = await requireAuth();
    if (!user) return;

    console.log("Welcome to the dashboard, user ID:", user.id);

});