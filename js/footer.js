let isMobile = window.innerWidth<=768;

window.onresize = () => {
    isMobile = window.innerWidth<=768;
};

// --- CONTACT SECTION ---

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