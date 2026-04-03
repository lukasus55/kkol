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

    async function handleTournamentTab(tabContainer,) {
        const playerID = user.id;

        const [tournamentsData, playerData] = await Promise.all([
            loadData('/api/tournaments'),
            loadData('/api/players')
        ]);

        const player = playerData[playerID] ?? {};
        const playerTournaments = player.tournaments ?? {};
        const attendedTournaments = Object.keys(playerTournaments);
        const tournaments = [];

        attendedTournaments.forEach(tournamentId => {
            if (tournamentsData[tournamentId]) {
                tournaments.push(tournamentsData[tournamentId]);
            }
        });

        // Sort tournaments descending
        tournaments.sort((a, b) => b.details.timestamp - a.details.timestamp);

        let allCardsHTML = '';

        tournaments.forEach(tournament => {
            if (!tournament) return;

            const isTournamentFinished = tournament.finished;
            const playerTournamentData = playerTournaments[tournament.id] ?? {};

            const tournamentName = tournament.displayed_name;
            const tournamentTier = tournament.details.tier;
            const playerPosition = playerTournamentData.position;

            const tournamentPageExists = tournament.page_exists;
            const tournamentPageUrl = tournamentPageExists ? tournament.page_url : '#';

            allCardsHTML += `
                <div class="tournament_card"> 
                    <div class="name">                     
                        ${tournamentPageExists ? `
                            <a href="/${tournamentPageUrl}"> ${tournamentName} </a>` : `${tournamentName}`
                        } 
                    </div>
                    <div class="pos"> ${playerPosition && isTournamentFinished ? `#${playerPosition}` : `-`} </div>
                    <div class="tier"> ${tournamentTier ?? '?'}-Tier </div>
                    <div class="info"> <button class="tournament_details"> <img src="/img/dashboard/leave_icon.webp"> </button></div>
                </div>`;
        });

        // Inject everything into the DOM at once
        tabContainer.insertAdjacentHTML('beforeend', allCardsHTML);
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
    handleHeader();
    handleTabs();

    if (loadingContainer) {
        container.removeChild(loadingContainer);
    }
});