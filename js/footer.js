const showYearButton = document.querySelector('#drag_out');
const showYearButton2 = document.querySelector('#year_text');
const showYearButtonIcon = document.querySelector('.drag_out_img');
const yearPopup = document.querySelector('#year_selector');
const footerYear = document.querySelector('#footer_menu');
const yearContainer = document.querySelector('#year_selector_texts');
const footerYearDisable = document.querySelector('#footer_menu_disable');
var currentYearStatus = 0;

var deviceWidthF = (window.innerWidth > 0) ? window.innerWidth : screen.width;

function showSeletor() {
    yearPopup.style.backgroundColor = "#000000";
    if(deviceWidthF<2560)
        {
            yearPopup.style.height = "200px"; 
        }
    else
        {
            yearPopup.style.height = "300px";
        };
    showYearButtonIcon.style.rotate = "180deg";
    footerYear.style.opacity = 0;
    currentYearStatus = 1;
    yearContainer.style.display = "flex";

    setTimeout(() => {
        footerYearDisable.style.display = "none";
    }, 500);
}

function closeSeletor() {
    yearPopup.style.backgroundColor = "#00000000";
    yearPopup.style.height = "20px";
    showYearButtonIcon.style.rotate = "0deg";
    footerYear.style.opacity = 1;
    currentYearStatus = 0;
    yearContainer.style.display = "none";

    setTimeout(() => {
        footerYearDisable.style.display = "flex";
    }, 500);
}

showYearButton.addEventListener('click', () => {
    if (currentYearStatus == 0) {
        showSeletor();
    }
    else {
        closeSeletor();
    };
});

if (showYearButton2) 
{
    showYearButton2.addEventListener('click', () => {
        if (currentYearStatus == 0) {
            showSeletor();
        }
        else {
            closeSeletor();
        };
    });
}



const contact = document.querySelector('#contact');
const contactButton = document.getElementById("footer_icons_contact");
const contactContainer = document.querySelector('#contact_container');
var currentContactStatus = 0;

function showContact() {

    if(deviceWidthF>768)
        {
            contact.style.height = "60px"; 
        }
    else
        {
            contact.style.height = "120px";
        };

    setTimeout(() => {
        contactContainer.style.display = "flex";
    }, 300);
 
    currentContactStatus = 1;
    contactButton.classList.add('footer_icons_active');
    
}

function closeContact() {
    contactContainer.style.display = "none";
    contact.style.height = "0px";
    currentContactStatus = 0;
    contactButton.classList.remove('footer_icons_active');
}

contactButton.addEventListener('click', () => {
    if (currentContactStatus == 0) {
        showContact()
    }
    else {
        closeContact()
    };
});


