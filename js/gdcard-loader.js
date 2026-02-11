import { loadData } from "/js/helpers.js";

export default async function gdLoader() {
    const data = await loadData('/api/gd');

    function getPlayerCustomName(rawId) {
        if (rawId === 'kukula') {
            return "KUŁ"
        }
        
        // The Standard Rule (First 3 chars, Uppercase)
        const code = rawId.substring(0, 3).toUpperCase();
        return code
    };

    const html = `
        <div class="gd_card_header">
            <div class="icon"><img src=""></div>
            <div class="title">-</div>
        </div>
        <div class="gd_card_results">
            ${/* Generate 4 player slots strictly for layout */ ''}
            <div class="gd_card_player" id="gd_player_1"> 
                <div class="gd_player_position">-</div>
                <div class="gd_player_cube"><img src=""></div>
                <div class="gd_player_name">-</div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_2"> 
                <div class="gd_player_position">-</div>
                <div class="gd_player_cube"><img src=""></div>
                <div class="gd_player_name">-</div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_3"> 
                <div class="gd_player_position">-</div>
                <div class="gd_player_cube"><img src=""></div>
                <div class="gd_player_name">-</div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_4"> 
                <div class="gd_player_position">-</div>
                <div class="gd_player_cube"><img src=""></div>
                <div class="gd_player_name">-</div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    const levelAmount = data.levels.length;

    for (let id = 0; id < levelAmount; id++) {
        const level = data.levels[id];
        const container = document.getElementById(`gd_card_container`);
        
        // Create Card
        const card = document.createElement('div');
        card.classList.add('gd_card');
        card.setAttribute("id", `gd_card_${id}`);
        card.innerHTML = html;
        container.append(card);

        // Fill Header
        const title = card.querySelector(".title");
        const icon = card.querySelector(".icon img");
        title.textContent = level.name;
        icon.src = `/img/2026/GDDifficulties/${level.difficulty}.webp`;

        // Sort Players
        const sortedPlayers = [...level.players].sort((a, b) => {
            if (a.position !== b.position) return a.position - b.position;
            return a.id.localeCompare(b.id);
        });

        // Fill Players
        for (let i = 0; i < sortedPlayers.length; i++) {
            const player = sortedPlayers[i];
            
            const playerCustomName = getPlayerCustomName(player.id);

            const playerDiv = card.querySelector(`#gd_player_${i+1}`);
            
            if (playerDiv) {
                playerDiv.querySelector('.gd_player_name').textContent = playerCustomName;
                playerDiv.querySelector('.gd_player_cube img').src = `/img/2026/GDCubes/${player.id}.webp`;
                playerDiv.querySelector('.gd_progress_text').textContent = `${player.score}%`;
                playerDiv.querySelector('.gd_progress_fill').style.width = `${player.score}%`;
                playerDiv.querySelector('.gd_player_position').textContent = `#${player.position}`;
            }
        }
    }
}