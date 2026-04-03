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
                        data-id="${tournament.id}" 
                        data-name="${tournamentName}">
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
        editButtons.forEach(button => {
            button.addEventListener('click', () => {
                const clickedTournamentData = {
                    id: button.getAttribute('data-id'),
                    name: button.getAttribute('data-name')
                };
                // openEditPopup(clickedTournamentData);
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