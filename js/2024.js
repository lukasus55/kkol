var deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;

function animatePodium() {

    const platform1 = document.querySelector('#platform_first');
    const platform2 = document.querySelector('#platform_second');
    const platform3 = document.querySelector('#platform_third');
    const player1 = document.querySelector('#player_first');
    const player2 = document.querySelector('#player_second');
    const player3 = document.querySelector('#player_third');
    const button = document.querySelector('#play_again_button');

    platform3.style.opacity = 0;
    platform2.style.opacity = 0;
    platform1.style.opacity = 0;
    player1.style.opacity = 0;
    player2.style.opacity = 0;
    player3.style.opacity = 0;
    platform3.style.transform = 'translateY(50px)';
    platform2.style.transform = 'translateY(50px)';
    platform1.style.transform = 'translateY(50px)';
    button.style.opacity = 0;
    button.disabled = true;
    button.style.cursor = "not-allowed";

    // Add a small delay before triggering the animation

    setTimeout(() => {
        platform3.style.opacity = 1;
        platform3.style.transform = 'translateY(0)';
    }, 500);
    setTimeout(() => {
        player3.style.opacity = 1;
    }, 1000);

    setTimeout(() => {
        platform2.style.opacity = 1;
        platform2.style.transform = 'translateY(0)';
    }, 1500);
    setTimeout(() => {
        player2.style.opacity = 1;
    }, 2000);

    setTimeout(() => {
        platform1.style.opacity = 1;
        platform1.style.transform = 'translateY(0)';
    }, 2500);
    setTimeout(() => {
        player1.style.opacity = 1;
        button.style.opacity = 1;
        button.disabled = false;
        button.style.cursor = "pointer";
    }, 3000);

}

const showPopupButton = document.querySelector('#ranking_button');
const rankingPopup = document.querySelector('#ranking_popup');
const closePopupButton = document.querySelector('#ranking_popup_close_tab');

showPopupButton.addEventListener('click', () => {
    rankingPopup.style.display = "flex";
});

// Hide the popup when the close button is clicked
closePopupButton.addEventListener('click', () => {
    rankingPopup.style.display = "none";
});

const showGame4PopupButton = document.querySelector('#game4_image');
const game4Popup = document.querySelector('#game4_popup');
const closeGame4Popup = document.querySelector('#game4_popup');

showGame4PopupButton.addEventListener('click', () => {
    game4Popup.style.display = "flex";
});

closeGame4Popup.addEventListener('click', () => {
    game4Popup.style.display = "none";
});

const game1 = document.querySelector('.game1');
const game2 = document.querySelector('.game2');
const game3 = document.querySelector('.game3');
const game4 = document.querySelector('.game4');
const rgame1 = document.querySelector('.ranking_game1_td');//
const rgame2 = document.querySelector('.ranking_game2_td');//  Icons in ranking table
const rgame3 = document.querySelector('.ranking_game3_td');//
const rgame4 = document.querySelector('.ranking_game4_td');//

const resultsContainer = document.querySelector('#games_results');
const resultsTitle = document.querySelector('#results_title');
const resultsTitleContent = document.querySelector('#results_title_content');

const resultsGame1 = document.querySelector('.results_game1');
const resultsGame2 = document.querySelector('.results_game2');
const resultsGame3 = document.querySelector('.results_game3');
const resultsGame4 = document.querySelector('.results_game4');

const game4Image = document.querySelector('#game4_results_image_container');
const game4Text = document.querySelector('#game4_results_text_container');

if(deviceWidth<=768)
{
    game4Image.style.display = "none"
    game4Text.style.display = "flex"
}
else
{
    game4Image.style.display = "flex"
    game4Text.style.display = "none"
}

document.addEventListener("DOMContentLoaded", () => {
    animatePodium();
    changeGame(game1, "300px", "Minigolf", resultsGame1);
});

function changeGame(game, height, title, results_game) {
    game1.style.opacity = 0.5;
    game2.style.opacity = 0.5;
    game3.style.opacity = 0.5;
    game4.style.opacity = 0.5;
    resultsGame1.style.display = "none";
    resultsGame2.style.display = "none";
    resultsGame3.style.display = "none";
    resultsGame4.style.display = "none";
    resultsGame1.style.opacity = 0;
    resultsGame2.style.opacity = 0;
    resultsGame3.style.opacity = 0;
    resultsGame4.style.opacity = 0;

    game.style.opacity = 1;

    if ((height == "800px") && (deviceWidth<=768))
    {
        height = "300px"
    }

    resultsContainer.style.height = height;
    resultsTitleContent.textContent = title

    results_game.style.display = "flex";
    results_game.style.opacity = 1;
    // setTimeout(() => {
    //     results_game.style.opacity = 1;
    // }, 500);
}

game1.addEventListener('click', () => {
    changeGame(game1, "300px", "Minigolf", resultsGame1);
});

game2.addEventListener('click', () => {
    changeGame(game2, "500px", "Monopoly", resultsGame2);
});

game3.addEventListener('click', () => {
    changeGame(game3, "550px", "Bilard", resultsGame3);
});

game4.addEventListener('click', () => {
    changeGame(game4, "800px", "Kinect", resultsGame4);
});

rgame1.addEventListener('click', () => {
    changeGame(game1, "300px", "Minigolf", resultsGame1);
});

rgame2.addEventListener('click', () => {
    changeGame(game2, "500px", "Monopoly", resultsGame2);
});

rgame3.addEventListener('click', () => {
    changeGame(game3, "550px", "Bilard", resultsGame3);
});

rgame4.addEventListener('click', () => {
    changeGame(game4, "800px", "Kinect", resultsGame4);
});
// document.getElementById("#button").onclick = doFunction;