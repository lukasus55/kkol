import { appendLoaderDiv } from "./helpers.js";

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.login_card');
    const loginForm = document.querySelector('#login_form');

    loginForm.addEventListener('submit', async (event) => {
        const loadingContainer = appendLoaderDiv(container);
        // Stop the browser from instantly refreshing the page
        event.preventDefault(); 

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }) 
            });

            const data = await response.json();

            // Check if the API gave a 200 OK status
            if (response.ok) {
                console.log("Success:", data.message);
                
                // Redirect the user to the private area!
                // Change '/dashboard.html' to whatever page they should see after logging in
                window.location.href = '/dashboard.html'; 
            } else {
                // If it failed (401 Unauthorized), show them the error
                const loginFailedDiv = document.querySelector('.login_failed')

                if (loginFailedDiv.classList.contains('hiddenInstant')) {loginFailedDiv.classList.remove('hiddenInstant')}
            }
            
        } catch (error) {
            console.error("Network error:", error);
            alert("Something went wrong communicating with the server.");
        }

        container.removeChild(loadingContainer);
    });
});