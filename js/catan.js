const catanClosePopupButton = document.querySelector('#catan_popup_close');
const catanClosePopupButton2 = document.querySelector('#catan_popup_close_2');

var catanPopup = document.querySelector('#catan_popup');
var catanPopupWidth = document.getElementById("catan_popup").offsetWidth
catanPopup.style.display = "none";

var catanHexagon = document.querySelectorAll('.catan_hexagon');
var catanPopupResource = document.querySelector('#catan_popup_resource');
var catanPopupDice = document.querySelector('#catan_popup_dice');
var catanPopupPropability = document.querySelector('#catan_popup_propability');
var catanHexagonForest = document.querySelectorAll('.catan_hexagon_forest');
var catanHexagonStone = document.querySelectorAll('.catan_hexagon_stone');
var catanHexagonPlains = document.querySelectorAll('.catan_hexagon_plains');
var catanHexagonWheat = document.querySelectorAll('.catan_hexagon_wheat');
var catanHexagonBricks = document.querySelectorAll('.catan_hexagon_bricks');
var catanHexagonDesert = document.querySelectorAll('.catan_hexagon_desert');
var catanShip = document.querySelectorAll('.catan_ship');
var catanMapBackground = document.querySelector('#catan_interactive_map_container');
var catanPopupStats = document.querySelector('#catan_popup_stats');
var catanPopupShipStats = document.querySelector('#catan_popup_ship_stats');
var catanPopupTradeGood = document.querySelector('#catan_popup_trade_good');
var catanPopupProportions = document.querySelector('#catan_popup_proportions');

function defineDivs(round)
{
    let round_suffix = ""
    if (round === 2) {round_suffix = "_2"}

    catanPopup = document.querySelector(`#catan_popup${round_suffix}`);
    catanPopupWidth = document.getElementById(`catan_popup${round_suffix}`).offsetWidth

    catanHexagon = document.querySelectorAll(`.catan_hexagon${round_suffix}`);
    catanPopupResource = document.querySelector(`#catan_popup_resource${round_suffix}`);
    catanPopupDice = document.querySelector(`#catan_popup_dice${round_suffix}`);
    catanPopupPropability = document.querySelector(`#catan_popup_propability${round_suffix}`);
    catanHexagonForest = document.querySelectorAll(`.catan_hexagon_forest${round_suffix}`);
    catanHexagonStone = document.querySelectorAll(`.catan_hexagon_stone${round_suffix}`);
    catanHexagonPlains = document.querySelectorAll(`.catan_hexagon_plains${round_suffix}`);
    catanHexagonWheat = document.querySelectorAll(`.catan_hexagon_wheat${round_suffix}`);
    catanHexagonBricks = document.querySelectorAll(`.catan_hexagon_bricks${round_suffix}`);
    catanHexagonDesert = document.querySelectorAll(`.catan_hexagon_desert${round_suffix}`);
    catanShip = document.querySelectorAll(`.catan_ship${round_suffix}`);
    catanMapBackground = document.querySelector(`#catan_interactive_map_container${round_suffix}`);
    catanPopupStats = document.querySelector(`#catan_popup_stats${round_suffix}`);
    catanPopupShipStats = document.querySelector(`#catan_popup_ship_stats${round_suffix}`);
    catanPopupTradeGood = document.querySelector(`#catan_popup_trade_good${round_suffix}`);
    catanPopupProportions = document.querySelector(`#catan_popup_proportions${round_suffix}`);
}

function closeCatanPopup(round=1)
{
    defineDivs(round)
    catanPopup.style.display = "none";
    catanHexagon.forEach(item => {
        item.style.filter = "brightness(100%)";
    });
    catanShip.forEach(item => {
        item.style.backgroundImage = "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))";
    });
}

catanClosePopupButton.addEventListener('click', () => {
    closeCatanPopup(1)
});

catanClosePopupButton2.addEventListener('click', () => {
    closeCatanPopup(2)
});


function showCatanPopup(resource, stat1, stat2, element, round=1) 
{
    defineDivs(round)
    if (catanPopup.style.display == "flex" && (element.style.filter == "brightness(100%)" || element.style.backgroundImage == "linear-gradient(rgba(0, 0, 0, 0), rgba(0, 0, 0, 0))"))
    {
        closeCatanPopup(round);
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

    var position = {
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