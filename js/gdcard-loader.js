import { loadData } from "/js/helpers.js";

export default async function gdLoader() {
    const data = await loadData('/gd.json');

    const html =
    `
        <div class="gd_card_header">
            <div class="icon">
                <img src="/img/2026/GDDifficulties/Easy.webp">
            </div>
            <div class="title">
                -
            </div>
        </div>
        <div class="gd_card_results">
            <div class="gd_card_player" id="gd_player_1"> 
                <div class="gd_player_position">
                    -
                </div>
                <div class="gd_player_cube">
                    <img src="">
                </div>
                <div class="gd_player_name">
                    -
                </div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_2"> 
                <div class="gd_player_position">
                    -
                </div>
                <div class="gd_player_cube">
                    <img src="">
                </div>
                <div class="gd_player_name">
                    -
                </div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_3"> 
                <div class="gd_player_position">
                    -
                </div>
                <div class="gd_player_cube">
                    <img src="">
                </div>
                <div class="gd_player_name">
                    -
                </div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
            <div class="gd_card_player" id="gd_player_4"> 
                <div class="gd_player_position">
                    -
                </div>
                <div class="gd_player_cube">
                    <img src="">
                </div>
                <div class="gd_player_name">
                    -
                </div>
                <div class="gd_player_bar">
                    <div class="gd_progress_bar">
                        <div class="gd_progress_fill" style="width: 0%;"></div>
                        <span class="gd_progress_text">-</span>
                    </div>
                </div>
            </div>
        </div>
    `

    const levelAmount = data.levels.length;

    for (let id = 0; id <= levelAmount-1; id++) {

        const level = data.levels[id];

        const levelName = level.name;
        const playersAmount = level.players.length;
        const difficulty = level.difficulty;

        const container = document.getElementById(`gd_card_container`);
        
        const card = document.createElement('div');
        card.classList.add('gd_card');
        card.setAttribute("id", `gd_card_${id}`);

        container.append(card);

        document.getElementById(`gd_card_${id}`).innerHTML = html;

        const title = document.querySelector(`#gd_card_${id} ` + ".title");
        const icon = document.querySelector(`#gd_card_${id} ` + ".icon img");

        title.textContent = levelName;
        icon.src = `/img/2026/GDDifficulties/${difficulty}.webp`

        const players = level.players;
        
        const sortedPlayers = [...players].sort((a, b) => {
            // Primary Sort: Position
            if (a.position !== b.position) {
                return a.position - b.position;
            }

            // Secondary Sort: Name 
            return a.name.localeCompare(b.name);
        });

        for (let i = 0; i <= playersAmount-1; i++)
        {
            const player = sortedPlayers[i];

            const playerNameText = document.querySelector(`#gd_card_${id} ` +`#gd_player_${i+1} ` + `.gd_player_name`);
            const cubeImage = document.querySelector(`#gd_card_${id} ` +`#gd_player_${i+1} ` + `.gd_player_cube img`);
            const progressText = document.querySelector(`#gd_card_${id} ` +`#gd_player_${i+1} ` + `.gd_progress_text`);
            const progressFill = document.querySelector(`#gd_card_${id} ` +`#gd_player_${i+1} ` + `.gd_progress_fill`);
            const positionText = document.querySelector(`#gd_card_${id} ` +`#gd_player_${i+1} ` + `.gd_player_position`);

            playerNameText.textContent = player.name;
            cubeImage.src = `/img/2026/GDCubes/${player.id}.webp`
            progressText.textContent = `${player.score}%`;
            progressFill.style.width = `${player.score}%`;
            positionText.textContent = `#${player.position}`;
        }
    };

}
