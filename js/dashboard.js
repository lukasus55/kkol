import { createLogoutButton, loadData, requireAuth, appendLoaderDiv } from "./helpers.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const container = document.querySelector('body');
    const loadingContainer = document.querySelector('#loader-global');

    // Authenticate & Fetch User
    const userAuthenticated = await requireAuth();
    if (!userAuthenticated) return;

    const userData = await loadData('/api/me');
    const user = userData.user;

    const logoutBtn = document.querySelector('#logout_btn');
    createLogoutButton(logoutBtn, container);

    // Popup naming rules: showXyzPopup - create its functioanlities and show it, handleXyzPopup - create its deafult functionalities, openXyzPopup - edit its deafult functionalities if needed ans show it

    function showErrorPopup(message) {
        const popup = document.getElementById('error_popup');
        const messageEl = document.getElementById('error_message');
        const closeBtn = document.getElementById('error_close_btn');

        messageEl.textContent = message;

        popup.classList.add('active');

        closeBtn.onclick = () => {
            popup.classList.remove('active');
        };

        // Close if clicking outside the box
        popup.onclick = (event) => {
            if (event.target === popup) {
                popup.classList.remove('active');
            }
        };
    }

    function handleConfirmationPopup() {
        const popup = document.getElementById('universal_popup');
        const cancelBtn = document.getElementById('popup_cancel');
        const confirmBtn = document.getElementById('popup_confirm');

        function closePopup() {
            popup.classList.remove('active');
        }

        cancelBtn.addEventListener('click', closePopup);

        confirmBtn.addEventListener('click', () => {
            console.log("User confirmed leaving the tournament.");
            
            closePopup();
        });

        popup.addEventListener('click', (event) => {
            if (event.target === popup) {
                closePopup();
            }
        });
    }

    function openLeavingPopup(tournament) {
        const popup = document.getElementById('universal_popup');
        popup.classList.add('active');

        const popup_message = document.querySelector('#popup_message');
        popup_message.innerHTML = `<p id="popup_message">Czy na pewno chcesz opuścić turniej <span class="highlight">${tournament.name}</span>?</p>`;

        const leaveBtn = document.getElementById('popup_confirm');

        leaveBtn.onclick = async () => {
            // Disable the button so they can't double-click it while it loads
            leaveBtn.disabled = true;
            leaveBtn.textContent = 'Opuszczanie...';

            try {
                const response = await fetch('/api/leave_tournament', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ tournamentId: tournament.id })
                });

                if (response.ok) {
                    popup.classList.remove('active');
                    window.location.reload(); 
                } else {
                    const errorData = await response.json(); 
                    
                    // Hide the leaving confirmation popup first
                    popup.classList.remove('active');
                    
                    // Reset the leave button just in case
                    leaveBtn.disabled = false;
                    leaveBtn.textContent = 'Opuść';

                    showErrorPopup(errorData.error || "Wystąpił nieznany błąd.");
                }
            } catch (error) {
                popup.classList.remove('active');
                leaveBtn.disabled = false;
                leaveBtn.textContent = 'Opuść';
                
                showErrorPopup("Błąd połączenia z serwerem.");
            }
        };
    }

    async function showTournamentPopup(tournamentId, tournamentsData) {
        const popup = document.getElementById('tournament_popup');
        const nameEl = document.getElementById('editor_tournament_name');
        const tierEl = document.getElementById('editor_tournament_tier');
        const listEl = document.getElementById('editor_players_list');
        
        const closeBtn = document.getElementById('editor_cancel_btn');
        const saveBtn = document.getElementById('editor_save_btn');

        // Populate Header
        const tournament = tournamentsData[tournamentId];
        nameEl.textContent = tournament.displayed_name;
        tierEl.textContent = `Tier: ${tournament.details.tier ?? '?'}`;

        // Show loading state & open popup immediately
        listEl.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">Ładowanie graczy...</td></tr>`;
        popup.classList.add('active');

        // Fetch backend data
        try {
            const response = await fetch(`/api/tournament_editor_details?tournamentId=${tournamentId}`);
            
            if (!response.ok) {
                throw new Error("Brak uprawnień lub błąd serwera");
            }
            
            const data = await response.json();
            const members = data.members;

            let html = '';
            members.forEach(member => {
                // Apply the faded style if they haven't attended
                const attendedClass = member.attended ? 'player_attended' : 'player_unattended';
                const posValue = member.position !== null ? member.position : '';
                const ptsValue = member.total_points !== null ? member.total_points : '';

                html += `
                    <tr class="${attendedClass}" data-player-id="${member.id}">
                        <td>
                            <strong>${member.displayed_name}</strong> <br>
                            <small style="color: gray;">
                                ${!member.attended ? 'Wycofany' : ''} 
                                ${!member.attended && member.organizer_role ? ' • ' : ''}
                                ${member.organizer_role ? `<span>${member.organizer_role.toUpperCase()}</span>` : ''}
                            </small>
                        </td>
                        <td>
                            <input type="number" class="editor_input pos_input" value="${posValue}" placeholder="-">
                        </td>
                        <td>
                            <input type="number" step="0.5" class="editor_input pts_input" value="${ptsValue}" placeholder="-">
                        </td>
                        <td>
                            <button class="kick_btn" title="Wyrzuć gracza">
                                <img src="/img/dashboard/kick_icon.png" alt="Wyrzuć">
                            </button>
                        </td>
                    </tr>
                `;
            });

            // Inject the generated HTML
            listEl.innerHTML = html;

        } catch (error) {
            console.error(error);
            listEl.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-warning-red); padding: 2rem;">Nie udało się załadować danych.</td></tr>`;
        }

        // Button Listeners
        const closePopup = () => {
            popup.classList.remove('active');
        };

        closeBtn.onclick = closePopup;
        
        saveBtn.onclick = async () => {
            // Prevent double clicks
            saveBtn.disabled = true;
            saveBtn.textContent = 'Zapisywanie...';

            const rows = listEl.querySelectorAll('tr[data-player-id]');
            const updatedResults = [];

            rows.forEach(row => {
                const playerId = row.getAttribute('data-player-id');
                const posValue = row.querySelector('.pos_input').value;
                const ptsValue = row.querySelector('.pts_input').value;

                updatedResults.push({
                    player_id: playerId,
                    // Convert empty strings to null for the database, otherwise parse them
                    position: posValue === '' ? null : parseInt(posValue, 10),
                    total_points: ptsValue === '' ? null : parseFloat(ptsValue)
                });
            });

            // Send to backend
            try {
                const response = await fetch('/api/save_tournament_results', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        tournament_id: tournamentId,
                        results: updatedResults
                    })
                });

                if (response.ok) {
                    closePopup();
                    window.location.reload(); 
                } else {
                    const errorData = await response.json();
                    closePopup(); // Hide editor
                    showErrorPopup(errorData.error || "Nie udało się zapisać zmian.");
                }
            } catch (error) {
                console.error(error);
                closePopup();
                showErrorPopup("Błąd połączenia z serwerem.");
            } finally {
                // Reset button state just in case it stays open
                saveBtn.disabled = false;
                saveBtn.textContent = 'Zapisz';
            }
        };

        popup.onclick = (event) => {
            if (event.target === popup) {
                closePopup();
            }
        };
    }
    

    function handleHeader() {
        const id = user.id;
        const displayedName = user.displayed_name;
        const roleId = user.role;
        const pfpPath = user.pfp_url;

        const profilePicture = document.querySelector('#player_pfp');
        const nameDiv = document.querySelector('#player_name');
        const roleDiv = document.querySelector('#player_role');

        profilePicture.src = user.pfp_url;
        nameDiv.innerHTML = `${displayedName}&nbsp;<span class="id">@${id}</span>`;

        const roles = {
            'player': {
                name: 'Konto gracza',
                description: 'Masz dostęp do edytowania twojego profilu. Możesz akceptować zaproszenia do turniejów.',
            },
            'organizer': {
                name: 'Konto organizatora',
                description: 'Możesz tworzyć turnieje i zapraszać do nich graczy. Masz wszystkie możliwości konta gracza.',
            },
            'admin': {
                name: 'Konto administratora',
                description: 'Masz dostęp do panelu administratora. Masz wszystkie możliwości konta organizatora',
            },
        };

        const roleName = roles[roleId].name;
        
        roleDiv.textContent = roleName;
        roleDiv.classList.add(`role_badge-${roleId}`);
    }

    async function handleTournamentTab(tabContainer, currentUser) {
        
        const tournamentsData = await loadData('/api/tournaments');

        const playerTournaments = currentUser.tournaments ?? {};
        const organizerRoles = currentUser.organizer_roles ?? {}; 
        
        const tournaments = [];

        Object.keys(playerTournaments).forEach(tournamentId => {
            const resultData = playerTournaments[tournamentId];
            
            // Only push if they attended AND the tournament exists in the master list
            if (resultData.attended && tournamentsData[tournamentId]) {
                tournaments.push(tournamentsData[tournamentId]);
            }
        });

        // Sort tournaments descending
        tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

        let allCardsHTML = '';

        tournaments.forEach(tournament => {
            if (!tournament) return;

            // Grab the specific player's result data for this iteration
            const playerTournamentData = playerTournaments[tournament.id];

            const isTournamentFinished = tournament.finished;
            const tournamentName = tournament.displayed_name;
            const tournamentTier = tournament.details.tier;
            const playerPosition = playerTournamentData.position;

            const tournamentPageExists = tournament.page_exists;
            const tournamentPageUrl = tournamentPageExists ? tournament.page_url : '#';

            // Check if the user has a role in this specific tournament
            const userRole = organizerRoles[tournament.id];
            const canEdit = userRole === 'owner' || userRole === 'manager';

            allCardsHTML += `
                <div class="tournament_card"> 
                    <div class="name">                     
                        ${tournamentPageExists ? `
                            <a href="/${tournamentPageUrl}"> ${tournamentName} </a>` : `${tournamentName}`
                        } 
                    </div>
                    <div class="pos"> ${playerPosition && isTournamentFinished ? `#${playerPosition}` : `-`} </div>
                    <div class="tier"> ${tournamentTier ?? '?'}-Tier </div>
                    
                    <div class="action"> 
                        ${canEdit ? `<button 
                        class="tournament_btn 
                        edit_tournament_btn"
                        data-id="${tournament.id}">
                            <img src="/img/dashboard/edit_icon.webp"> 
                        </button>` : ''}
                    </div>
                    
                    <div class="action"> 
                        ${tournamentTier !== 'S' ? `<button 
                        class="tournament_btn 
                        leave_tournament_btn"
                        data-id="${tournament.id}" 
                        data-name="${tournamentName}">
                            <img src="/img/dashboard/leave_icon.webp"> 
                        </button>` : ''}
                    </div>
                </div>`;
        });

        // Inject everything into the DOM at once
        tabContainer.insertAdjacentHTML('beforeend', allCardsHTML);

        // Attach Event Listeners

        const leaveButtons = tabContainer.querySelectorAll('.leave_tournament_btn');
        leaveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const clickedTournamentData = {
                    id: button.getAttribute('data-id'),
                    name: button.getAttribute('data-name')
                };
                openLeavingPopup(clickedTournamentData);
            });
        });

        const editButtons = tabContainer.querySelectorAll('.edit_tournament_btn');
        await editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const clickedTournamentId = button.getAttribute('data-id');
                showTournamentPopup(clickedTournamentId, tournamentsData);
            });
        });
    }

    function handleTabs() {
        let currentTab = 'account'; // Starts on 'account'
        const tabs = document.querySelectorAll('.selector ul li');
        
        const loadedTabs = {
            account: true,
            tournaments: false 
        };

        async function tabChange(tab) {
            const tabId = tab.id.replace('selector_', '');
            
            if (currentTab === tabId) return;

            currentTab = tabId;

            // Handle UI Class swapping
            document.querySelector('.selector ul li.active')?.classList.remove('active');
            tab.classList.add('active');

            document.querySelector('.content .tab_content.active')?.classList.remove('active');
            const tabContent = document.querySelector(`#content_${tabId}`);
            tabContent.classList.add('active');

            // Only fetch data and show loader if the tab HAS NOT been loaded yet
            if (!loadedTabs[tabId]) {
                const innerLoader = appendLoaderDiv(tabContent);

                try {
                    switch (tabId) {
                        case 'tournaments':
                            await handleTournamentTab(tabContent, user);
                            break;
                    }
                    
                    loadedTabs[tabId] = true;
                    
                } catch (error) {
                    console.error(`Failed to load ${tabId} tab:`, error);
                } finally {
                    tabContent.removeChild(innerLoader);
                }
            }
        }

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabChange(tab);
            });
        });
    }

    // Initialize the UI
    handleConfirmationPopup()
    handleHeader();
    handleTabs();

    if (loadingContainer) {
        container.removeChild(loadingContainer);
    }
});