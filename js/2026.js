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
const logoDiv = document.querySelector('.navbar_container .logo');
const seasonDiv = document.querySelector('.navbar_container .season');
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

// GEOMETRY DASH SCROLL SEQUENCE

const canvas = document.getElementById('gd_hero_canvas');
const context = canvas.getContext('2d');
const container = document.querySelector('.gd_scroll_container');

// CONFIG
const config = {
    frameCount: 600,      // Total prepared: 996
    startNumber: 206,
    interval: 5,   
    fileExtension: 'webp',
    fileNamePrefix: '/assets/gd_frames/StereoMadness' // Ensure no trailing dash if not in filename
};

const images = [];
const gdState = {
    frame: 0 // Always start at array index 0, regardless of filename
};

// 1. PRELOAD IMAGES
// We calculate the correct filename number here, but store them in order [0, 1, 2...]
const preloadImages = () => {
    for (let i = 0; i < config.frameCount; i++) {
        const fileNumber = config.startNumber + (i * config.interval);
        
        // PAD: Ensure the number string format matches your file
        const formattedNumber = fileNumber.toString().padStart(5, '0');

        const img = new Image();
        img.src = `${config.fileNamePrefix}${formattedNumber}.${config.fileExtension}`;
        images.push(img);
    }
};

// Start preloading
preloadImages();

// Helper: "Cover" logic for Canvas
const drawImageProp = (ctx, img) => {
    if (!img) return;

    const canvasWidth = ctx.canvas.width;
    const canvasHeight = ctx.canvas.height;
    const imgWidth = img.width;
    const imgHeight = img.height;
    
    const r1 = imgWidth / imgHeight;
    const r2 = canvasWidth / canvasHeight;
    
    let renderWidth, renderHeight, offsetX, offsetY;

    if (r2 > r1) {
        renderWidth = canvasWidth;
        renderHeight = canvasWidth / r1;
    } else {
        renderWidth = canvasHeight * r1;
        renderHeight = canvasHeight;
    }

    offsetX = (canvasWidth - renderWidth) / 2;
    offsetY = (canvasHeight - renderHeight) / 2;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
};

// Render Loop
const render = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    
    // We use the array index directly
    const imageToDraw = images[gdState.frame];
    
    if (imageToDraw && imageToDraw.complete) {
        drawImageProp(context, imageToDraw);
    }
};

// Initial render of first frame
// We wait for the first image (index 0) specifically
if (images[0]) {
    images[0].onload = render;
}

// The Scroll Logic
window.addEventListener('scroll', () => {
    const rect = container.getBoundingClientRect();
    
    const containerHeight = rect.height - window.innerHeight;
    let percentScrolled = -rect.top / containerHeight;

    percentScrolled = Math.max(0, Math.min(1, percentScrolled));

    // Map percentage to Array Index (0 to 995)
    const frameIndex = Math.floor(percentScrolled * (config.frameCount - 1));

    if (frameIndex !== gdState.frame) {
        gdState.frame = frameIndex;
        requestAnimationFrame(render);
    }
});

window.addEventListener('resize', () => {
    requestAnimationFrame(render);
});