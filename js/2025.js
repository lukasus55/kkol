var deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var deviceHeight = (window.innerHeight > 0) ? window.innerHeight : screen.height;

const resultsPopup = document.querySelector('#results_popup');
const resultsContainer = document.querySelector('#results_container');
const resultsGameSection = document.querySelector('#results_game');
const resultsChooseGame = document.querySelector('#results_choose_game');
const resultsFooterDisabler = document.querySelector('#results_footer_disabled');

let disabledButtons = [];

resultsPopup.style.display = "none";

function closeResultsPopup()
{
    resultsPopup.style.display = "none";
}

const resultsTitle = document.querySelector('#results_title');

function showResultsPopup(game)
{

    resultsGameSection.style.display = "none";
    resultsPopup.style.display = "flex";

    if (!game) 
    {
        const gamesIcons = document.querySelectorAll('.results_footer_container_single_game');
        gamesIcons.forEach(item => {
            item.classList.remove("results_footer_container_single_game_active");
        });

        resultsContainer.style.height = "6.25rem";
        resultsChooseGame.style.scale = "1";
        resultsGameSection.style.display = "none";
        resultsChooseGame.style.display = "flex";
    }
    else
    {
        showGameResults(game);
    }

}

function showGameResults(game)
{
    if (!game) 
    {
        console.error('ERROR: ResultsPopup - Game not specified!');
        return;
    }

    if(disabledButtons.includes(game))
    {
        return;
    }

    resultsContainer.style.height = "min(calc(100% - 150px),25rem)";
    const isAlreadySelected = document.querySelector(`#results_footer_${game}`).classList.value.includes('results_footer_container_single_game_active') //Checks if it is already showing this game
    if (isAlreadySelected)
    {
        hideGameResults(game);
        return;
    }

    const gamesIcons = document.querySelectorAll('.results_footer_container_single_game');
    gamesIcons.forEach(item => {
        item.classList.remove("results_footer_container_single_game_active");
    });

    // resultsContainer.style.height = Math.min(deviceHeight-150,400)+"px";
    resultsChooseGame.style.scale = "0";
    resultsGameSection.style.scale = "1";

    const thisGameButton  = document.querySelector(`#results_footer_${game}`);
    thisGameButton.classList.add("results_footer_container_single_game_active");
    thisGameButton.style.cursor = "not-allowed";

    disabledButtons.push(game);

    setTimeout(() => {
        disabledButtons.splice(disabledButtons.indexOf(game), 1); // remove button from the disabledButtons
        thisGameButton.style.cursor = "pointer";
        resultsGameSection.style.display = "flex";
        resultsChooseGame.style.display = "none";
    }, "1000");

    let title = game.toUpperCase();
    if (game==='brain') { title = 'BRAIN SHOW' }
    if (game==='pummel') { title = 'PUMMEL PARTY' }

    resultsTitle.textContent = title;

    const gamesBoxes = document.querySelectorAll('.results_single_game');

    const finishedGames = ['catan', 'codenames', 'brain']
    const isFinished = finishedGames.includes(game);
    let thisGameBox = document.querySelector(`#results_game_noResults`);

    if (isFinished) 
    {
        thisGameBox = document.querySelector(`#results_game_${game}`);
    }

    gamesBoxes.forEach(item => {
        item.style.display = "none";
    });

    thisGameBox.style.display = "flex";
}

function hideGameResults(game)
{
    resultsContainer.style.height = "6.25rem"; // Reset height to default
    resultsChooseGame.style.display = "flex";
    resultsChooseGame.style.scale = "1";
    resultsGameSection.style.scale = "0";
    resultsGameSection.style.display = "none";

    const thisGameButton = document.querySelector(`#results_footer_${game}`);
    thisGameButton.classList.remove("results_footer_container_single_game_active");
    thisGameButton.style.cursor = "not-allowed";

    disabledButtons.push(game);

    setTimeout(() => {
        thisGameButton.style.cursor = "pointer";
        disabledButtons.splice(disabledButtons.indexOf(game), 1); // remove button from the disabledButtons
    }, "1000");
}


const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    })
})

const hiddenElements = document.querySelectorAll('.hidden')
hiddenElements.forEach((el) => observer.observe(el));

const listObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            for( i=0; i<entry.target.children.length; i++ )
            {
                entry.target.children[i].classList.add('showSingle');
            }
        }
        else 
        {
            for( i=0; i<entry.target.children.length; i++ )
            {
                entry.target.children[i].classList.remove('showSingle');
            }
        }
    })


})

const hiddenListofElements = document.querySelectorAll('.hiddenList')
hiddenListofElements.forEach((el) => listObserver.observe(el));


/* champion animation */
document.addEventListener('DOMContentLoaded', () => {
    const section = document.getElementById('championSection');
    const colors = ['#FFD700', '#C0C0C0', '#ffffff', '#B8860B']; // Gold, Silver, White

    function createConfetti() {
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.classList.add('confetti');
            
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = -10 + 'px';
            
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            confetti.style.width = Math.random() * 10 + 5 + 'px';
            confetti.style.height = Math.random() * 10 + 5 + 'px';
            
            confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
            confetti.style.animationDelay = Math.random() * 2 + 's';

            section.appendChild(confetti);

            // remove after animation to clean DOM
            setTimeout(() => {
                confetti.remove();
            }, 5000);
        }
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                createConfetti();
            }
        });
    });

    observer.observe(section);
});