import { appendLoaderDiv } from "./utils/helpers.js";

const container = document.querySelector('.login_card');
const loginForm = document.querySelector('#login_form');

const urlParams = new URLSearchParams(window.location.search);
const encodedDestination = urlParams.get('r') || 'dashboard';
const destination = decodeURIComponent(encodedDestination);
const redirectUrl = `/${destination}`

loginForm.addEventListener('submit', async (event) => {
    
    const loadingContainer = appendLoaderDiv(container, 'global_transparent');

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
        if (response.ok) {
            console.log("Success:", data.message);
            
            // Redirect the user to the private area!
            window.location.href = destination; 
        } else {
            container.removeChild(loadingContainer);
            
            const loginFailedDiv = document.querySelector('.login_failed')

            if (loginFailedDiv.classList.contains('hiddenInstant')) {loginFailedDiv.classList.remove('hiddenInstant')}
        }
        
    } catch (error) {
        container.removeChild(loadingContainer);

        console.error("Network error:", error);
        alert("Something went wrong communicating with the server.");
    }
});

const noAccountBtn = document.querySelector('#question-acc');
const forgotBtn = document.querySelector('#question-forgot');

noAccountBtn.addEventListener('click', () => {
    showAnswer("Nie masz konta?", "Konta posiadają jedynie gracze uczestniczący w turniejach KKOL. Organizator powinien przekazać dane do logowania. Nie ma możliwości samodzielnego założenia konta.")
});
forgotBtn.addEventListener('click', () => {
    showAnswer("Zapomniałeś hasła?", "Skontaktuj się z administratorem. <a href='/contact'>Lista kontaktów.</a>")
});

function showAnswer(question, answer) {
    const answerEl = document.querySelector('#answer');
    const contentEl = document.querySelector('.answer_content');
    const titleEl = document.querySelector('.answer_title');

    answerEl.classList.remove('hidden');
    contentEl.innerHTML = answer;
    titleEl.textContent = question;
}