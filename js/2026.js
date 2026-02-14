import { loadData } from '/js/helpers.js'

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
            for( let i=0; i<entry.target.children.length; i++ )
            {
                entry.target.children[i].classList.add('showSingle');
            }
        }
        else 
        {
            for( let i=0; i<entry.target.children.length; i++ )
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

async function geometryCardLoader() {
    const gdData = await loadData('/api/gd');
    const levels = gdData.levels;
    const playersCount = 4;

    // Hardcoded points map: 1st=4, 2nd=3, 3rd=2, 4th=1
    const RANK_POINTS = { 1: 4, 2: 3, 3: 2, 4: 1 };

    const playersStats = [
        { id:"kostys", displayedName: "Kostyś", totalPoints: 0, allScores: [] },
        { id:"damidami2", displayedName: "DamiDami2", totalPoints: 0, allScores: [] },
        { id:"harnas", displayedName: "Harnoldihno", totalPoints: 0, allScores: [] },
        { id:"kukula", displayedName: "Kukuła", totalPoints: 0, allScores: [] },
    ];

    levels.forEach(level => {
        if (!level.finished) return; 
        if (!level.players || level.players.length !== playersCount) return;

        // Count how many players are in each position
        const positionCounts = {};
        level.players.forEach(p => {
            const pos = p.position;
            positionCounts[pos] = (positionCounts[pos] || 0) + 1;
        });

        // Pre-calculate the points awarded for each position found
        const pointsForPosition = {};
        
        for (const [posStr, count] of Object.entries(positionCounts)) {
            const startRank = parseInt(posStr, 10);
            
            // Calculate sum of points for the "disputed" spots
            // If 2 people are 1st, points for Rank 1 and Rank 2 are summed and splitted (Ex Aequo rule 1.8.1).
            let sumPoints = 0;
            for (let i = 0; i < count; i++) {
                const currentRank = startRank + i;
                sumPoints += (RANK_POINTS[currentRank] || 0);
            }
            pointsForPosition[posStr] = sumPoints / count;

        }

        for (let i = 0; i < playersCount; i++) {
            const playerInfo = level.players[i];
            const position = playerInfo.position;
            const score = parseInt(playerInfo.score);

            // Find the correct player in your stats array by matching the name
            const targetPlayer = playersStats.find(p => p.id === playerInfo.id);

            if (targetPlayer) {
                // Add the pre-calculated points for this position
                if (pointsForPosition[position] !== undefined) {
                    targetPlayer.totalPoints += pointsForPosition[position];
                }
                
                targetPlayer.allScores.push(score);
            } else {
                console.warn(`Could not find stats object for player: ${playerInfo.name}`);
            }
        }

    });

    const sortedPlayerStats = [...playersStats].sort((a, b) => {
        // Primary Sort: TotalPoints
        if (a.totalPoints !== b.totalPoints) {
            if (a.totalPoints < b.totalPoints) { return 1; }
            if (a.totalPoints > b.totalPoints) { return -1; }
            return 0;
        }

        // Secondary Sort: Name 
        return a.displayedName.localeCompare(b.displayedName);
    });

    sortedPlayerStats.forEach(player => {
        const playerName = player.displayedName;
        const playerPoints = player.totalPoints;
        const playerSumScore = player.allScores.reduce((partialSum, a) => partialSum + a, 0);
        const playerAverageScore = playerSumScore / player.allScores.length;

        const container = document.querySelector('#gdcard_results');
        const cardHTML = `
            <tr>
                <td class="player_name">${playerName}</td>
                <td class="text-right highlight">${playerPoints.toFixed(1)}</td>
                <td class="text-right">${playerAverageScore.toFixed(2)}</td>
            </tr>
        `;

        container.insertAdjacentHTML('beforeend', cardHTML);
    });

}

geometryCardLoader();