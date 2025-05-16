var deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;
var deviceHeight = (window.innerHeight > 0) ? window.innerHeight : screen.height;

const resultsPopup = document.querySelector('#results_popup');
const resultsContainer = document.querySelector('#results_container');
const resultsGameSection = document.querySelector('#results_game');
const resultsChooseGame = document.querySelector('#results_choose_game');
const resultsFooterDisabler = document.querySelector('#results_footer_disabled');

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

        resultsContainer.style.height = "100px";
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

    const thisGameIcon  = document.querySelector(`#results_footer_${game}`);
    thisGameIcon.classList.add("results_footer_container_single_game_active");

    resultsContainer.style.height = Math.min(deviceHeight-150,500)+"px";
    resultsChooseGame.style.scale = "0";
    resultsGameSection.style.scale = "1";
    resultsFooterDisabler.style.display = "flex";
    setTimeout(() => {
        resultsGameSection.style.display = "flex";
        resultsChooseGame.style.display = "none";
        resultsFooterDisabler.style.display = "none";
    }, "1000");

    let title = game.toUpperCase();
    if (game==='room') { title = 'ESCAPE ROOM' }
    if (game==='pummel') { title = 'PUMMEL PARTY' }

    resultsTitle.textContent = title;

    const gamesBoxes = document.querySelectorAll('.results_single_game');

    const finishedGames = ['catan']
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
    console.log(`test`)
    resultsContainer.style.height = "100px";
    resultsChooseGame.style.display = "flex";
    resultsChooseGame.style.scale = "1";
    resultsGameSection.style.scale = "0";
    resultsGameSection.style.display = "none";
    resultsFooterDisabler.style.display = "flex";

    const thisGameIcon  = document.querySelector(`#results_footer_${game}`);
    thisGameIcon.classList.remove("results_footer_container_single_game_active");

    setTimeout(() => {
        resultsFooterDisabler.style.display = "none";
    }, "1000");
}

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