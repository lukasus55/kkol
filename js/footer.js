//==================== SEASON SELECTOR SECTION ====================

console.log('test')

const showSelectorButton = document.querySelector('#show_selector_button');
const selectorContainer = document.querySelector('#season_selector_container');
const selectorBox = document.querySelector('#season_selector_box');

let isMobile = window.innerWidth<=768;

window.onresize = () => {
    isMobile = window.innerWidth<=768;
};

let hideTimeout;

function hideSelector()
{
        selectorContainer.classList.remove('show');
        showSelectorButton.classList.remove('active');
}

function showSelector()
{
        clearTimeout(hideTimeout); // Cancel any pending hide
        selectorContainer.classList.add('show');
        showSelectorButton.classList.add('active');
}

function trytHideSelector()
{
    hideTimeout = setTimeout(() => {
        if (!selectorContainer.matches(':hover') && !showSelectorButton.matches(':hover') && !isMobile) {
            hideSelector()
        }
    }, 100);
}

showSelectorButton.addEventListener("mouseenter", () => {
    if(isMobile) {return;}
    showSelector()
});

selectorContainer.addEventListener("mouseenter", () => {
    clearTimeout(hideTimeout);
});

showSelectorButton.addEventListener("mouseleave", trytHideSelector);
selectorContainer.addEventListener("mouseleave", trytHideSelector);

showSelectorButton.addEventListener("click", () => {
    if(selectorContainer.classList.contains("show"))
    {
        hideSelector();
    }
    else
    {
        showSelector();
    }
});


//==================== CONTACT SECTION ====================

const showContactButton = document.querySelector('#show_contact_button');
const contactContainer = document.querySelector('#contact_container');

showContactButton.addEventListener("click", () => {
    console.log(contactContainer.classList)
    if(contactContainer.classList.contains("show"))
    {
        contactContainer.classList.remove("show");
        showContactButton.classList.remove("active");
    }
    else
    {
        contactContainer.classList.add("show");
        showContactButton.classList.add("active");
    }
});