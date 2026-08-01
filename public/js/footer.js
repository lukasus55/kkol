const mediaQuery = window.matchMedia('(max-width: 768px)');
let isMobile = mediaQuery.matches;

mediaQuery.addEventListener('change', (e) => {
    isMobile = e.matches;
});