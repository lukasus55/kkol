var deviceWidth = (window.innerWidth > 0) ? window.innerWidth : screen.width;

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