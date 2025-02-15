var deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;

const showPopupButton = document.querySelector('#ranking_button');
const rankingPopup = document.querySelector('#ranking_popup');
const closePopupButton = document.querySelector('#ranking_popup_close_tab');

showPopupButton.addEventListener('click', () => {
    rankingPopup.style.display = "flex";
});

closePopupButton.addEventListener('click', () => {
    rankingPopup.style.display = "none";
});

const catanPopup = document.querySelector('#catan_popup');
const catanPopupWidth = document.getElementById("catan_popup").offsetWidth
catanPopup.style.display = "none";

const catanHexagon = document.querySelectorAll('.catan_hexagon');
const catanClosePopupButton = document.querySelector('#catan_popup_close');
const catanPopupResource = document.querySelector('#catan_popup_resource');
const catanPopupDice = document.querySelector('#catan_popup_dice');
const catanPopupPropability = document.querySelector('#catan_popup_propability');
const catanHexagonForest = document.querySelectorAll('.catan_hexagon_forest');
const catanHexagonStone = document.querySelectorAll('.catan_hexagon_stone');
const catanHexagonPlains = document.querySelectorAll('.catan_hexagon_plains');
const catanHexagonWheat = document.querySelectorAll('.catan_hexagon_wheat');
const catanHexagonBricks = document.querySelectorAll('.catan_hexagon_bricks');
const catanHexagonDesert = document.querySelectorAll('.catan_hexagon_desert');
const catanShip = document.querySelectorAll('.catan_ship');
const catanMapBackground = document.querySelector('#catan_interactive_map_container');
const catanPopupStats = document.querySelector('#catan_popup_stats');
const catanPopupShipStats = document.querySelector('#catan_popup_ship_stats');
const catanPopupTradeGood = document.querySelector('#catan_popup_trade_good');
const catanPopupProportions = document.querySelector('#catan_popup_proportions');

function closeCatanPopup()
{
    catanPopup.style.display = "none";
    catanHexagon.forEach(item => {
        item.style.filter = "brightness(100%)";
    });
    catanShip.forEach(item => {
        item.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))";
    });
}

catanClosePopupButton.addEventListener('click', () => {
    closeCatanPopup()
});


function showCatanPopup(resource, stat1, stat2, element) 
{

    if (catanPopup.style.display == "flex" && (element.style.filter == "brightness(100%)" || element.style.backgroundImage == "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))"))
    {
        closeCatanPopup();
        return;
    }

    var resourceText = resource;

    catanHexagon.forEach(item => {
        item.style.filter = "brightness(30%)";
    });
    catanShip.forEach(item => {
        item.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5))";
    });

    function changeBrightness(resourceHexagon, element)
    {
        if (resource != 'ship')
        {
            resourceHexagon.forEach(item => {
                item.style.filter = "brightness(55%)";
            });
            element.style.filter = "brightness(100%)";
        }

        else
        {
            element.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))";
        }
    }

    if (resource=='forest')
    {
        changeBrightness(catanHexagonForest, element)
        resourceText = "Drewno";
    }
    else if (resource=='stone')
    {
        changeBrightness(catanHexagonStone, element)
        resourceText = "Ruda";
    }
    else if (resource=='plains')
    {
        changeBrightness(catanHexagonPlains, element)
        resourceText = "Owce";
    }
    else if (resource=='wheat')
    {
        changeBrightness(catanHexagonWheat, element)
        resourceText = "Zboże";
    }
    else if (resource=='bricks')
    {
        changeBrightness(catanHexagonBricks, element)
        resourceText = "Glina";
    }
    else if (resource=='desert')
    {
        changeBrightness(catanHexagonDesert, element)
        resourceText = "Pustynia";
    }
    else if (resource=='ship')
    {
        changeBrightness(catanShip, element)
        resourceText = "Statek";
    }

    if (resource!='ship')
    {
        catanPopupStats.style.display = "flex";
        catanPopupShipStats.style.display = "none";
        catanPopupResource.textContent = resourceText;
        catanPopupDice.textContent = stat1;
        catanPopupPropability.textContent = stat2;
    }
    else
    {
        catanPopupResource.textContent = resourceText;
        catanPopupProportions.textContent = stat1;
        catanPopupTradeGood.textContent = stat2;
        catanPopupStats.style.display = "none";
        catanPopupShipStats.style.display = "flex";
    }

    const rect = element.getBoundingClientRect(); // Get element position relative to viewport
    const viewportWidth = window.innerWidth;

    let position = {
        top: rect.top + window.scrollY - 100, // Adjust for scrolling
        left: rect.left + window.scrollX
    };
    
    if (position.left + catanPopupWidth > viewportWidth) {
        position.left = viewportWidth - catanPopupWidth - 10;
    }

    if (position.left < 0) {
        position.left = 10; 
    }
    
    catanPopup.style.top = position.top + "px";
    catanPopup.style.left = position.left + "px";
    catanPopup.style.display = "flex";
    
}

// catanPopup.style.display = "flex";

var catanResultsCurrentRound = 0;
const catanResultsDot0 = document.querySelector('.selector_dot_0');
const catanResultsDot1 = document.querySelector('.selector_dot_1');
const catanResultsDot2 = document.querySelector('.selector_dot_2');
const catanResultsDot3 = document.querySelector('.selector_dot_3');
const catanResultsDot4 = document.querySelector('.selector_dot_4');
const catanResultsContainer0 = document.querySelector('#catan_results_round_0');
const catanResultsContainer1 = document.querySelector('#catan_results_round_1');
const catanResultsContainer2 = document.querySelector('#catan_results_round_2');
const catanResultsContainer3 = document.querySelector('#catan_results_round_3');
const catanResultsContainer4 = document.querySelector('#catan_results_round_4');
const catanResultsRoundNumber = document.querySelector('#catan_results_games_round');


function changeCatanRound(newRound)
{
    
    catanResultsDot0.style.backgroundColor = '#ffffff00';
    catanResultsDot1.style.backgroundColor = '#ffffff00';
    catanResultsDot2.style.backgroundColor = '#ffffff00';
    catanResultsDot3.style.backgroundColor = '#ffffff00';
    catanResultsDot4.style.backgroundColor = '#ffffff00';
    catanResultsContainer0.style.display = 'none';
    catanResultsContainer1.style.display = 'none';
    catanResultsContainer2.style.display = 'none';
    catanResultsContainer3.style.display = 'none';
    catanResultsContainer4.style.display = 'none';

    if (newRound == 'next')
    {
        newRound = catanResultsCurrentRound+1;
        if (newRound > 4)
        {
            newRound = 0;
        };
    };

    if (newRound == 'previous')
    {
        newRound = catanResultsCurrentRound-1;
        if (newRound < 0)
        {
            newRound = 4;
        };
    };

    
    if (newRound == 0)
    {
        catanResultsDot0.style.backgroundColor = '#ffffff';
        catanResultsContainer0.style.display = 'flex';
    }
    else if (newRound == 1)
    {
        catanResultsDot1.style.backgroundColor = '#ffffff';
        catanResultsContainer1.style.display = 'flex';
    }
    else if (newRound == 2)
    {
        catanResultsDot2.style.backgroundColor = "#ffffff";
        catanResultsContainer2.style.display = 'flex';
    }
    else if (newRound == 3)
    {
        catanResultsDot3.style.backgroundColor = "#ffffff";
        catanResultsContainer3.style.display = 'flex';
    }
    else if (newRound == 4)
    {
        catanResultsDot4.style.backgroundColor = "#ffffff";
        catanResultsContainer4.style.display = 'flex';
    };

    catanResultsCurrentRound = newRound;
    if (newRound != 0)
    {
        catanResultsRoundNumber.textContent = `RUNDA ${newRound}`;
    }
    else
    {
        catanResultsRoundNumber.textContent = `WSZYSTKIE RUNDY`;
    }
    
}

function catanCountdown() 
{
    const catanCountdown = document.querySelector('#catanBy');
    const catanGamesBox = document.querySelector('#catan_results_games_box');

    var now = Math.floor(new Date().getTime() / 1000);
    var countdownDate = Math.floor(new Date("Jun 1, 2025 12:00:00").getTime() / 1000);

    var flipdown = new FlipDown(countdownDate, "catanBy",
    {
        theme: "light",
        headings: ["Dni", "Godziny", "Minuty", "Sekundy"],
    })
    
    .start()

    .ifEnded(() => {
        catanCountdown.style.display = "none";
        catanGamesBox.style.display = "flex";
    });

    if ((countdownDate - now)/86400 >= 100) //If more than 3 digits on days number then make the div wider
    {
        catanCountdown.style.width = "570px";
    }
}


document.addEventListener('DOMContentLoaded', () => {
    changeCatanRound(0);
    catanCountdown();
});