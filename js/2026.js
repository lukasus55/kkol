// Header buttons logic
document.querySelectorAll('.buttons a').forEach(anchor => {
    const button = anchor.querySelector('.single_button');
    const img = button.querySelector('img');

    if (img) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon-mask';
        iconDiv.style.setProperty('--icon-url', `url('${img.src}')`);
        
        const gameName = anchor.getAttribute('href').replace('#', '');
        const labelSpan = document.createElement('span');
        labelSpan.className = 'label';
        labelSpan.innerText = gameName.charAt(0).toUpperCase() + gameName.slice(1);

        button.innerHTML = ''; 
        button.appendChild(iconDiv);
        button.appendChild(labelSpan);
    }
});

// Header scrolling logic
const headerDiv = document.querySelector('.header_container');
const seasonDiv = document.querySelector('.header_container .season');
const threshold = 1; // Pixel value to trigger the hide

window.addEventListener('scroll', () => {
    if (window.scrollY > threshold) {
        seasonDiv.classList.add('hide-season');
    } else {
        seasonDiv.classList.remove('hide-season');
    }
});

// Scroll animations logic
const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
        } else {
            entry.target.classList.remove('show');
        }
    })
})

const hiddenElements = document.querySelectorAll('.hidden')
hiddenElements.forEach((el) => observer.observe(el));

const listObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            for( i=0; i<entry.target.children.length; i++ )
            {
                entry.target.children[i].classList.add('showSingle');
            }
        }
        else 
        {
            for( i=0; i<entry.target.children.length; i++ )
            {
                entry.target.children[i].classList.remove('showSingle');
            }
        }
    })


})

const hiddenListofElements = document.querySelectorAll('.hiddenList')
hiddenListofElements.forEach((el) => listObserver.observe(el));
