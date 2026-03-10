const mediaQuery = window.matchMedia('(max-width: 768px)');
let isMobile = mediaQuery.matches;

mediaQuery.addEventListener('change', (e) => {
    isMobile = e.matches;
});

const showContactButton = document.querySelector('#show_contact_button');
const contactContainer = document.querySelector('#contact_container');

if (showContactButton && contactContainer) {
    showContactButton.addEventListener("click", () => {
        // .toggle() adds the class if it's missing, and removes it if it's there. 
        contactContainer.classList.toggle("show");
        showContactButton.classList.toggle("active");
    });
}