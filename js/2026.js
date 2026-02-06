// Buttons logic
// Select both types of buttons
const selector = '.buttons a .single_button, .buttons a .single_wide_button';

document.querySelectorAll(selector).forEach(button => {
    const img = button.querySelector('img');
    const existingLabel = button.querySelector('.label');

    if (img && existingLabel) {
        const iconDiv = document.createElement('div');
        iconDiv.className = 'icon-mask';
        iconDiv.style.setProperty('--icon-url', `url('${img.src}')`);
        
        button.innerHTML = ''; 
        button.appendChild(iconDiv);
        button.appendChild(existingLabel);
    }
});

// Header scrolling logic
const logoDiv = document.querySelector('.navbar .logo');
const seasonDiv = document.querySelector('.season_title .season');
const mainSection = document.querySelector('.main');
const logoThreshold = 1; // pixel value

window.addEventListener('scroll', () => {

    if (window.scrollY > logoThreshold) {
        seasonDiv.classList.add('hide-season');
        logoDiv.classList.add('show-logo');
    } else {
        seasonDiv.classList.remove('hide-season');
        logoDiv.classList.remove('show-logo');
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

const stats = document.querySelectorAll('.stat_value');

const observer2 = new IntersectionObserver((entries, observer2) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target;
            const target = parseInt(counter.innerText);
            
            counter.innerText = '0';
            
            const duration = Math.min(1000, Math.max(600, target * 200));
            
            animateCount(counter, 0, target, duration);
            
            observer2.unobserve(counter);
        }
    });
}, { threshold: 0.5 }); // Trigger when 50% of the item is visible

stats.forEach(stat => observer2.observe(stat));

// helper function
function animateCount(element, start, end, duration) {
    let startTimestamp = null;
    
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        
        element.innerText = Math.floor(progress * (end - start) + start);
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            element.innerText = end;
        }
    };
    
    window.requestAnimationFrame(step);
}


// Game cards mod switch logic
document.querySelectorAll('.game_card').forEach(card => {
    card.addEventListener('click', () => {
        card.classList.toggle('view-results');
        
        // Update the Text inside the button
        const textSpan = card.querySelector('.indicator_text');
        
        if (card.classList.contains('view-results')) {
            textSpan.innerText = "INFO";
        } else {
            textSpan.innerText = "STATS";
        }
    });
});