import { createLogoutButton, loadData, requireAuth, appendLoaderDiv } from "./helpers.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const container = document.querySelector('body');
    const loadingContainer = document.querySelector('#loader-global');

    let savedCalendarDate = null;

    // Authenticate & Fetch User
    const userAuthenticated = await requireAuth();
    if (!userAuthenticated) return;

    const userData = await loadData('/api/me');
    const user = userData.user;

    const logoutBtn = document.querySelector('#logout_btn');
    createLogoutButton(logoutBtn, container);

    // Popup naming rules: showXyzPopup - create its functioanlities and show it, handleXyzPopup - create its deafult functionalities, openXyzPopup - edit its deafult functionalities if needed ans show it, renderXyz = for tabs

    async function showTournamentPopup(tournamentId, tournamentsData) {
        const popup = document.getElementById('tournament_popup');
        const listEl = document.getElementById('editor_players_list');
        
        // Header
        const tourIdEl = document.getElementById('show_tour_id');

        const nameInput = document.getElementById('edit_tour_name');
        const dateInput = document.getElementById('edit_display_date');
        const timestampInput = document.getElementById('edit_timestamp');
        const finishedInput = document.getElementById('edit_finished');
        const tierSelect = document.getElementById('edit_tier');
        const tierBtn = document.getElementById('edit_tier_btn');
        
        const deleteBtn = document.getElementById('editor_delete_btn')
        const saveBtn = document.getElementById('editor_save_btn');

        // Populate Header Data
        const tournament = tournamentsData[tournamentId];
        
        tourIdEl.textContent = tournament.id || '';

        nameInput.value = tournament.displayed_name || '';
        dateInput.value = tournament.details?.displayed_date || '';
        timestampInput.value = tournament.details?.timestamp || '';
        finishedInput.checked = tournament.finished || false;
        
        const currentTier = tournament.details?.tier || 'C';
        tierSelect.value = currentTier;

        tierBtn.onclick = async (e) => {
            e.preventDefault();
            
            const selectedTier = tierSelect.value;
            
            // Visual feedback to prevent spam clicking
            tierBtn.disabled = true;
            tierBtn.textContent = '...';

            try {
                const res = await fetch('/api/change_tournament_tier', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournament_id: tournamentId,
                        new_tier: selectedTier
                    })
                });

                if (res.ok) {
                    closeAllPopups();
                    window.location.reload();
                } else {
                    const err = await res.json();
                    closeAllPopups();
                    showErrorPopup(err.error || "Błąd podczas zmiany tieru.");
                }
            } catch (error) {
                closeAllPopups();
                showErrorPopup("Błąd połączenia z serwerem.");
            } finally {
                tierBtn.disabled = false;
                tierBtn.textContent = 'Zmień tier';
            }
        };

        listEl.innerHTML = `<tr><td colspan="4" style="text-align:center; padding: 2rem;">Ładowanie graczy...</td></tr>`;
        popup.classList.add('active');

        try {
            const response = await fetch(`/api/tournament_editor_details?tournamentId=${tournamentId}`);
            
            if (!response.ok) {
                throw new Error("Brak uprawnień lub błąd serwera");
            }
            

            const data = await response.json();
            const members = data.members;
            const currentUserRole = data.current_user_role;

            if (currentUserRole === 'owner') {
                deleteBtn.style.display = 'block';
                
                deleteBtn.onclick = async () => {
                    showConfirmationPopup(
                        () => {deleteTournament(tournamentId)},
                        `UWAGA! Czy na pewno chcesz CAŁKOWICIE USUNĄĆ turniej <span class='highlight'>${tournamentId}</span>? Tej akcji NIE MOŻNA COFNĄĆ. Zostaną usunięte wszystkie wyniki, gracze i role organizatorów!`,
                        `Usuń`
                    )
                };
            } else {
                // Hide it if they are just a manager opening the popup
                deleteBtn.style.display = 'none';
            }

            let html = '';
            members.forEach(member => {
                const attendedClass = member.attended ? 'player_attended' : 'player_unattended';
                const posValue = member.position !== null ? member.position : '';
                const ptsValue = member.total_points !== null ? member.total_points : '';
                
                // Generate the Promote/Demote button if the current user is the owner
                let roleButtonHTML = '';
                if (currentUserRole === 'owner' && member.organizer_role !== 'owner') {
                    if (member.organizer_role === 'manager') {
                        roleButtonHTML = `
                            <button class="action_btn role_btn" data-action="demote" title="Zabierz uprawnienia managera">
                                <img src="/img/dashboard/demote_icon.webp" alt="Demote">
                            </button>`;
                    } else {
                        roleButtonHTML = `
                            <button class="action_btn role_btn" data-action="promote" title="Awansuj na managera">
                                <img src="/img/dashboard/promote_icon.webp" alt="Promote">
                            </button>`;
                    }
                }

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
                            <div class="action_buttons">
                                <button class="action_btn attend_btn" title="Zmień status">
                                    <img src="/img/dashboard/notepad_icon.webp" alt="Obecność">
                                </button>
                                ${roleButtonHTML}
                                ${
                                    (member.organizer_role !== 'owner' && !(currentUserRole === 'manager' && member.organizer_role === 'manager') && member.id !== user.id)
                                    ? `<button class="action_btn kick_btn" title="Wyrzuć gracza">
                                    <img src="/img/dashboard/kick_icon.webp" alt="Wyrzuć">
                                </button>` : ``}
                            </div>
                        </td>
                    </tr>
                `;
            });

            listEl.innerHTML = html;

            // Attach Toggle Attendance Listeners
            const attendButtons = listEl.querySelectorAll('.attend_btn');
            attendButtons.forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();

                    const row = btn.closest('tr');
                    const targetPlayerId = row.getAttribute('data-player-id');

                    btn.style.opacity = '0.5';
                    btn.disabled = true;

                    try {
                        const res = await fetch('/api/toggle_attendance', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                tournament_id: tournamentId,
                                target_player_id: targetPlayerId
                            })
                        });

                        if (res.ok) {
                            showTournamentPopup(tournamentId, tournamentsData); 
                        } else {
                            const err = await res.json();
                            closeAllPopups();
                            showErrorPopup(err.error || "Błąd podczas zmiany statusu obecności.");
                        }
                    } catch (error) {
                        closeAllPopups();
                        showErrorPopup("Błąd połączenia z serwerem.");
                    }
                };
            });

            // Attach Role Button Listeners
            const roleButtons = listEl.querySelectorAll('.role_btn');
            roleButtons.forEach(btn => {
                btn.onclick = async (e) => {
                    // Prevent the save button from accidentally firing if things bubble up
                    e.preventDefault(); 
                    
                    // Find the closest row to get the player ID
                    const row = btn.closest('tr');
                    const targetPlayerId = row.getAttribute('data-player-id');
                    const action = btn.getAttribute('data-action');

                    btn.style.opacity = '0.5';
                    btn.disabled = true;

                    try {
                        const res = await fetch('/api/update_organizer_role', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                tournament_id: tournamentId,
                                target_player_id: targetPlayerId,
                                action: action
                            })
                        });

                        if (res.ok) {
                            // Refresh the popup to show the new badge and updated button!
                            showTournamentPopup(tournamentId, tournamentsData); 
                        } else {
                            const err = await res.json();
                            closeAllPopups();
                            showErrorPopup(err.error || "Błąd zmiany uprawnień.");
                        }
                    } catch (error) {
                        closeAllPopups();
                        showErrorPopup("Błąd połączenia z serwerem.");
                    }
                };
            });

            // Attach Kick Button Listeners
            const kickButtons = listEl.querySelectorAll('.kick_btn');
            kickButtons.forEach(btn => {
                btn.onclick = async (e) => {
                    e.preventDefault();

                    const row = btn.closest('tr');
                    const targetPlayerId = row.getAttribute('data-player-id');
                    
                    showConfirmationPopup(
                        () => {kickPlayer(tournamentId, targetPlayerId, tournamentsData)},
                        `Czy na pewno chcesz wyrzucić gracza <span class="highlight">${targetPlayerId}</span> z turnieju <span class="highlight">${tournamentId}</span>? Ta akcja jest nieodwracalna i usunie wszystkie jego wyniki.`,
                        `Wyrzuć`
                    )
                    
                };
            });

            const addPlayerBtn = document.getElementById('add_player_btn');
            const addPlayerInput = document.getElementById('add_player_id');

            addPlayerInput.value = '';

            addPlayerBtn.onclick = async () => {
                const newPlayerId = addPlayerInput.value;

                if (!newPlayerId.trim()) {
                    showErrorPopup("Proszę wpisać ID gracza.");
                    return;
                }

                addPlayerBtn.disabled = true;
                addPlayerBtn.textContent = '...';

                try {
                    const res = await fetch('/api/add_player', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            tournament_id: tournamentId,
                            new_player_id: newPlayerId
                        })
                    });

                    if (res.ok) {
                        showTournamentPopup(tournamentId, tournamentsData); 
                    } else {
                        const err = await res.json();
                        closeAllPopups();
                        showErrorPopup(err.error || "Nie udało się dodać gracza.");
                    }
                } catch (error) {
                    closeAllPopups();
                    showErrorPopup("Błąd połączenia z serwerem.");
                } finally {
                    // Reset button state
                    addPlayerBtn.disabled = false;
                    addPlayerBtn.textContent = 'Dodaj';
                }
            };

        } catch (error) {
            console.error(error);
            listEl.innerHTML = `<tr><td colspan="4" style="text-align:center; color: var(--color-warning-red); padding: 2rem;">Nie udało się załadować danych.</td></tr>`;
        }
        
        // Button Listeners
        saveBtn.onclick = async () => {
            saveBtn.disabled = true;
            saveBtn.textContent = 'Zapisywanie...';

            // Gather Player Results
            const rows = listEl.querySelectorAll('tr[data-player-id]');
            const updatedResults = [];

            rows.forEach(row => {
                const playerId = row.getAttribute('data-player-id');
                const posValue = row.querySelector('.pos_input').value;
                const ptsValue = row.querySelector('.pts_input').value;

                updatedResults.push({
                    player_id: playerId,
                    position: posValue === '' ? null : parseInt(posValue, 10),
                    total_points: ptsValue === '' ? null : parseFloat(ptsValue)
                });
            });

            // Gather Tournament Header Info
            const tournamentInfo = {
                displayed_name: nameInput.value.trim(),
                displayed_date: dateInput.value.trim(),
                timestamp: parseInt(timestampInput.value, 10) || 0,
                finished: finishedInput.checked
            };

            try {
                const response = await fetch('/api/save_tournament_results', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        tournament_id: tournamentId,
                        results: updatedResults,
                        tournament_info: tournamentInfo // NEW: Sending header data!
                    })
                });

                if (response.ok) {
                    closeAllPopups();
                    window.location.reload(); 
                } else {
                    const errorData = await response.json();
                    closeAllPopups();
                    showErrorPopup(errorData.error || "Nie udało się zapisać zmian.");
                }
            } catch (error) {
                console.error(error);
                closeAllPopups();
                showErrorPopup("Błąd połączenia z serwerem.");
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = 'Zapisz';
            }
        };

    }

    function renderHeader() {
        const id = user.id;
        const displayedName = user.displayed_name;
        const roleId = user.role;
        const pfpSrc = user.pfp_base64 
            ? `data:image/webp;base64,${user.pfp_base64}` 
            : '/img/default_pfp.webp';

        const profilePicture = document.querySelector('#player_pfp');
        const nameDiv = document.querySelector('#player_name');
        const roleDiv = document.querySelector('#player_role');

        profilePicture.src = pfpSrc;
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

    async function renderTournamentTab(tabContainer) {

        const currentUser = user;

        const tournamentsData = await loadData('/api/tournaments');

        const userType = user.role
        const canAdd = userType === 'admin' || userType === 'organizer';

        if (canAdd) {
            const header = `
            <div class="tab_header">
                <div class="create_tournament_title"> Stwórz nowy turniej </div> 
                <input type="text" id="new_tournament_id" class="tournament_input text_input" placeholder="ID nowego turnieju...">
                <button class="btn_create_tournament" id="create_tournament"> Stwórz </button>
            </div>`;

            tabContainer.insertAdjacentHTML('beforeend', header);
        }

        const playerTournaments = currentUser.tournaments ?? {};
        const organizerRoles = currentUser.organizer_roles ?? {}; 
        
        const tournaments = [];

        Object.keys(playerTournaments).forEach(tournamentId => {
            const resultData = playerTournaments[tournamentId];
            
            if (tournamentsData[tournamentId]) {
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

        const createBtn = document.getElementById('create_tournament');
        if (createBtn) {
            createBtn.addEventListener('click', async () => {
                const idInput = document.getElementById('new_tournament_id');
                const newId = idInput.value.trim().replaceAll(' ', '_');;

                if (!newId) {
                    showErrorPopup("Proszę wpisać ID dla nowego turnieju.");
                    return;
                }

                createBtn.disabled = true;
                createBtn.textContent = '...';

                try {
                    const res = await fetch('/api/create_tournament', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ tournament_id: newId })
                    });

                    if (res.ok) {
                        // Inject a placeholder into the local data so the editor popup doesn't crash 
                        tournamentsData[newId] = {
                            id: newId,
                            displayed_name: newId,
                            finished: false,
                            details: { tier: 'C', timestamp: Math.floor(Date.now() / 1000) }
                        };

                        // Empty the input field
                        idInput.value = '';

                        // Open the editor instantly!
                        showTournamentPopup(newId, tournamentsData);
                    } else {
                        const err = await res.json();
                        showErrorPopup(err.error || "Błąd podczas tworzenia turnieju.");
                    }
                } catch (error) {
                    showErrorPopup("Błąd połączenia z serwerem.");
                } finally {
                    createBtn.disabled = false;
                    createBtn.textContent = 'Stwórz turniej';
                }
            });
        }

        const leaveButtons = tabContainer.querySelectorAll('.leave_tournament_btn');
        leaveButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tournament = {
                    id: button.getAttribute('data-id'),
                    name: button.getAttribute('data-name')
                };
                
                showConfirmationPopup(
                    () => {leaveTournament(tournament)},
                    `Czy na pewno chcesz opuścić turniej <span class="highlight">${tournament.id}</span>`,
                    `Opuść`
                )
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
    

    async function renderAccountTab(tabContainer) {
        
        const currentUser = user;

        const currentName = currentUser.displayed_name || '';
        
        const pfpSrc = currentUser.pfp_base64 
            ? `data:image/webp;base64,${currentUser.pfp_base64}` 
            : '/img/default_pfp.webp';

        const accountHTML = `
            <div class="account_wrapper">
                <h2 class="account_header">Ustawienia Konta</h2>

                <div class="account_card">
                    <h3 class="card_title">Zdjęcie profilowe</h3>
                    <div class="pfp_container">
                        <img src="${pfpSrc}" alt="Avatar" class="pfp_preview" id="account_pfp_preview">
                        <div class="pfp_actions">
                            <label for="pfp_upload_input" class="btn_secondary">Wybierz plik</label>
                            <input type="file" id="pfp_upload_input" class="hidden_input" accept="image/png, image/jpeg, image/webp">
                            <button class="btn_primary" id="save_pfp_btn" style="display: none;">Zapisz zdjęcie</button>
                        </div>
                    </div>
                </div>

                <div class="account_card">
                    <h3 class="card_title">Wyświetlana nazwa</h3>
                    <div class="name_container">
                        <input type="text" id="account_display_name" class="account_input" value="${currentName}" placeholder="Wpisz nową nazwę...">
                        <button class="btn_primary" id="save_name_btn">Zmień</button>
                    </div>
                </div>

                <div class="account_card placeholder_card">
                    <h3 class="card_title">Bezpieczeństwo i Email</h3>
                    <p class="placeholder_text">Więcej funkcjonalności niebawem...</p>
                </div>
            </div>
        `;

        tabContainer.insertAdjacentHTML('beforeend', accountHTML);

        // EVENT LISTENERS

        const saveNameBtn = document.getElementById('save_name_btn');
        const nameInput = document.getElementById('account_display_name');

        saveNameBtn.addEventListener('click', async () => {
            const newName = nameInput.value.trim();

            if (!newName) {
                showErrorPopup("Nazwa nie może być pusta.");
                return;
            }

            if (newName === currentName) {
                showErrorPopup("To jest już twoja aktualna nazwa.");
                return;
            }

            saveNameBtn.disabled = true;
            saveNameBtn.textContent = '...';

            try {
                const res = await fetch('/api/change_name', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ new_name: newName })
                });

                if (res.ok) {
                    window.location.reload(); 
                } else {
                    const err = await res.json();
                    showErrorPopup(err.error || "Nie udało się zmienić nazwy.");
                }
            } catch (error) {
                showErrorPopup("Błąd połączenia z serwerem.");
            } finally {
                saveNameBtn.disabled = false;
                saveNameBtn.textContent = 'Zmień';
            }
        });

        const pfpInput = document.getElementById('pfp_upload_input');
        const savePfpBtn = document.getElementById('save_pfp_btn');
        const pfpPreview = document.getElementById('account_pfp_preview');

        pfpInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                if (file.size > 5 * 1024 * 1024) {
                    showErrorPopup("Plik jest za duży! Maksymalny rozmiar to 5MB.");
                    pfpInput.value = '';
                    return;
                }

                pfpPreview.src = URL.createObjectURL(file);
                savePfpBtn.style.display = 'block'; 
            }
        });

        savePfpBtn.addEventListener('click', async () => {
            const file = pfpInput.files[0];
            if (!file) return;

            savePfpBtn.disabled = true;
            savePfpBtn.textContent = 'Zapisywanie...';

            // Convert the file to a Base64 string
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result;

                try {
                    const res = await fetch('/api/upload_pfp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ image_base64: base64String })
                    });

                    if (res.ok) {
                        window.location.reload(true); 
                    } else {
                        const err = await res.json();
                        showErrorPopup(err.error || "Błąd podczas przesyłania zdjęcia.");
                    }
                } catch (error) {
                    showErrorPopup("Błąd połączenia z serwerem.");
                } finally {
                    savePfpBtn.disabled = false;
                    savePfpBtn.textContent = 'Zapisz zdjęcie';
                }
            };

            reader.readAsDataURL(file);
        });

    }

    function handleEventPopup(intention = 'uknown', eventData = null, onSuccessCallback) {

        const popupEl = document.getElementById('universal_event_popup');
        const headerEl = document.getElementById('popup_header');
        
        const viewSection = document.getElementById('event_view_mode');
        const editSection = document.getElementById('event_edit_mode');
        
        const btnCancel = document.getElementById('btn_popup_cancel');
        const btnSave = document.getElementById('btn_popup_save');
        const btnDelete = document.getElementById('btn_popup_delete');

        btnSave.style.display = 'none';
        btnDelete.style.display = 'none';

        let mode;

        if (intention === 'create') { mode = 'create'}
        else {
            const tournament_id = eventData.extendedProps.tournament_id;
            const accessedTournamentsId = Object.keys(user.organizer_roles || {});

            if (user.role === 'admin' || accessedTournamentsId.includes(tournament_id)) {
                mode = 'edit';
            } else {
                mode = 'view';
            }
        }

        if (mode === 'view') {
            btnCancel.textContent = "Zamknij"; // Linjjka kodu z dedykacją dla DamiDami2
            headerEl.textContent = "Szczegóły Wydarzenia";
            viewSection.style.display = 'block';
            editSection.style.display = 'none';

            // Populate View Text
            document.getElementById('view_event_name').textContent = eventData.title;
            document.getElementById('view_event_tournament').textContent = eventData.extendedProps.tournament_id;
            document.getElementById('view_event_type').textContent = eventData.extendedProps.is_major ? 'Duże wydarzenie' : 'Małe wydarzenie';
            document.getElementById('view_event_start').textContent = eventData.start ? eventData.start.toLocaleString('pl-PL') : 'Brak';
            document.getElementById('view_event_end').textContent = eventData.end ? eventData.end.toLocaleString('pl-PL') : 'Brak';
        } 
        else if (mode === 'edit' || mode === 'create') {
            headerEl.textContent = mode === 'edit' ? "Edytuj Wydarzenie" : "Utwórz Nowe Wydarzenie";
            viewSection.style.display = 'none';
            editSection.style.display = 'block';
            btnSave.style.display = 'inline-block';
            btnCancel.textContent = "Anuluj";
            
            btnSave.textContent = mode === 'edit' ? "Zapisz Zmiany" : "Utwórz";

            const tournamentSelect = document.getElementById('edit_event_tournament');

            if (mode === 'edit') {
                btnDelete.style.display = 'inline-block';
                
                // Populate Inputs with existing data
                document.getElementById('edit_event_name').value = eventData.title;
                document.getElementById('edit_event_major').value = eventData.extendedProps.is_major ? "true" : "false";
                document.getElementById('edit_event_start').value = formatForDateTimeInput(eventData.start);
                document.getElementById('edit_event_end').value = formatForDateTimeInput(eventData.end);

                // Disable it and just put the current tournament ID in ther
                tournamentSelect.innerHTML = `<option value="${eventData.extendedProps.tournament_id}" selected>${eventData.extendedProps.tournament_id}</option>`;
                tournamentSelect.disabled = true;
                
                btnSave.onclick = () => console.log('UPDATE API CALL dla ID:', eventData.id);
                btnDelete.onclick = () => console.log('DELETE API CALL dla ID:', eventData.id);
            } 
            else {
                // mode === 'create'
                // Clear inputs, but pre-fill the clicked date

                document.getElementById('edit_event_name').value = '';
                document.getElementById('edit_event_tournament').value = '';
                document.getElementById('edit_event_major').value = 'false';
                
                const defaultStart = eventData ? `${eventData}T12:00` : ''; 
                document.getElementById('edit_event_start').value = defaultStart;
                document.getElementById('edit_event_end').value = '';

                tournamentSelect.disabled = false;
                tournamentSelect.innerHTML = '<option value="">Ładowanie turniejów...</option>'; // Temporary loading text
                
                // Fetch the active tournaments for this user
                fetch('/api/tournaments_active')
                    .then(res => res.json())
                    .then(tournaments => {
                        tournamentSelect.innerHTML = '';
                        
                        if (tournaments.error) throw new Error(tournaments.error);
                        
                        if (tournaments.length === 0) {
                            tournamentSelect.innerHTML = '<option value="" disabled selected>Brak aktywnych turniejów</option>';
                            btnSave.disabled = true;
                            return;
                        }

                        btnSave.disabled = false; 

                        tournaments.forEach(t => {
                            const option = document.createElement('option');
                            option.value = t.id;
                            option.textContent = t.displayed_name || t.id; // Fallback to ID if name is missing
                            tournamentSelect.appendChild(option);
                        });
                    })
                    .catch(err => {
                        console.error(err);
                        tournamentSelect.innerHTML = '<option value="" disabled selected>Błąd ładowania</option>';
                    });

                btnSave.onclick = () => console.log('CREATE API CALL uruchomiony');
            }
        }

        popupEl.classList.add('active');

        btnSave.onclick = async () => {
            // Gather all data from the inputs
            const name = document.getElementById('edit_event_name').value.trim();
            const tournamentId = document.getElementById('edit_event_tournament').value.trim();
            const isMajor = document.getElementById('edit_event_major').value === 'true';
            const startDate = document.getElementById('edit_event_start').value;
            const endDate = document.getElementById('edit_event_end').value;

            if (!name || !tournamentId || !startDate) {
                closeAllPopups();
                showErrorPopup("Wypełnij wszystkie wymagane pola (Nazwa, Turniej, Początek).");
                return;
            }

            // Prepare the payload
            const payload = {
                name: name,
                is_major: isMajor,
                tournament_id: tournamentId,
                start_date: startDate,
                end_date: endDate || null
            };

            try {
                let response;
                
                // API Calls based on mode
                if (mode === 'create') {
                    payload.creator_id = user.id;
                    
                    response = await fetch('/api/event_create', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                } else if (mode === 'edit') {
                    payload.id = eventData.id;
                    
                    response = await fetch('/api/event_update', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                }

                const result = await response.json();

                if (!response.ok || result.error) {
                    throw new Error(result.error || "Nie udało się zapisać wydarzenia.");
                }

                closeAllPopups();
                if (onSuccessCallback) onSuccessCallback();

            } catch (error) {
                closeAllPopups();
                showErrorPopup(error.message);
            }
        };

        btnDelete.onclick = async () => {
            showConfirmationPopup (
                () => {deleteEvent(eventData.id, onSuccessCallback)},
                `Czy na pewno chcesz usunąć wydarzenie <span class='highlight'>${eventData.title || ''}</span>? Tej operacji nie można cofnąć.`,
                `Usuń`
            ) 
        };

        popupEl.classList.add('active');
    }

    async function renderCalendarTab(tabContainer) {
        if (!tabContainer || !user?.id) return;

        const calendarEl = tabContainer.querySelector('.calendar');
        calendarEl.innerHTML = ''; 

        try {
            const calendarEvents = await loadData(`/api/events?player=${user.id}`);

            const calendar = new FullCalendar.Calendar(calendarEl, {

                initialView: 'dayGridMonth',

                initialDate: savedCalendarDate || new Date(),
                locale: 'pl',
                firstDay: 1, 
                height: 'auto',
                
                datesSet: function(info) {
                    savedCalendarDate = info.view.currentStart;
                },
                
                eventTimeFormat: {
                    hour: 'numeric',
                    minute: '2-digit',
                    omitZeroMinute: false, 
                    hour12: false 
                },

                headerToolbar: {
                    left: 'today',
                    center: 'prev,title,next', 
                    right: 'dayGridMonth,timeGridWeek'
                },

                buttonText: {
                    today: 'Dzisiaj',
                    day: 'Dzień',
                    week:'Tydzień',
                    month:'Miesiąc'
                },

                events: calendarEvents,
                
                eventClick: function(info) {
                    const event = info.event;
                    handleEventPopup('uknown', event, () => renderCalendarTab(tabContainer));
                },
                
                dateClick: function(info) {
                    handleEventPopup('create', info.dateStr, () => renderCalendarTab(tabContainer));
                }
            });

            calendar.render();

        } catch (error) {
            console.error("Nie udało się załadować kalendarza:", error);
        }
    }

    function handleTabs() {
    const urlParams = new URLSearchParams(window.location.search);
    let currentTab = urlParams.get('tab') || 'account'; 

    const tabs = document.querySelectorAll('.selector ul li');
    
    const loadedTabs = {
        account: false,
        tournaments: false 
    };

    async function tabChange(tabId, updateUrl = true) {
            if (currentTab === tabId && updateUrl) return;

            const tabElement = document.getElementById(`selector-${tabId}`);
            if (!tabElement) return;

            currentTab = tabId;

            // Update the URL without reloading the page
            if (updateUrl) {
                const newUrl = new URL(window.location);
                newUrl.searchParams.set('tab', tabId);
                window.history.pushState({ tab: tabId }, '', newUrl);
            }

            document.querySelector('.selector ul li.active')?.classList.remove('active');
            tabElement.classList.add('active');

            document.querySelector('.content .tab_content.active')?.classList.remove('active');
            const tabContent = document.querySelector(`#content-${tabId}`);
            if (tabContent) tabContent.classList.add('active');

            // Only fetch data and show loader if the tab HAS NOT been loaded yet
            if (!loadedTabs[tabId]) {
                const innerLoader = appendLoaderDiv(tabContent);

                try {
                    switch (tabId) {
                        case 'account':
                            await renderAccountTab(tabContent); 
                            break;
                        case 'tournaments':
                            await renderTournamentTab(tabContent); 
                            break;
                        case 'calendar':
                            await renderCalendarTab(tabContent);
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
                const tabId = tab.id.replace('selector-', '');
                tabChange(tabId);
            });
        });

        // Force the tabChange to run immediately for whatever tab is designated in the URL
        // (or 'account' by default), injecting the HTML.
        const startingTab = currentTab;
        currentTab = null; 
        tabChange(startingTab, false); // false = don't push a duplicate state to the URL history
    }

    // ===== HELPER FUNCTIONS =====

    function closeAllPopups() {
        const activePopups = document.querySelectorAll('.popup_overlay.active');
        
        activePopups.forEach(popup => {
            popup.classList.remove('active');
            popup.outerHTML = popup.outerHTML; // Ensures even worst browsers will move unused .onClick events to garbage.
        });
    }

    // Handle outside click & cancel buttons)
    document.addEventListener('click', (event) => {
        const clickedOutside = event.target.classList.contains('popup_overlay');
        
        // using .closest() in case of an icon inside the button
        const clickedCancelBtn = event.target.closest('.btn_cancel');

        if (clickedOutside || clickedCancelBtn) {
            closeAllPopups();
        }
    });

    // Handle the Escape Key
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeAllPopups();
        }
    });

    function showConfirmationPopup(actionCallback, message='Czy na pewno chcesz to zrobić?', confirmText='Potwierdź', cancelText='Anuluj') {
        const popup = document.getElementById('universal_popup');
        const closeBtn = document.querySelector('.btn_cancel_only_this');
        popup.classList.add('active');

        document.querySelector('#popup_message').innerHTML = message;
        document.querySelector('#popup_confirm').innerHTML = confirmText;
        document.querySelector('#popup_cancel').innerHTML = cancelText;

        const confirmBtn = document.getElementById('popup_confirm');
        confirmBtn.disabled = false;

        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true; 
            await actionCallback(); 
            popup.classList.remove('active');
        };

        closeBtn.onclick = () => {
            popup.classList.remove('active');
        };

        popup.onclick = (event) => {
            if (event.target === popup) {
                popup.classList.remove('active');
            }
        };
    }

    function showErrorPopup(message) {
        document.getElementById('error_message').textContent = message;
        document.getElementById('error_popup').classList.add('active');
    }

    // format dates for HTML inputs (YYYY-MM-DDTHH:MM)
    function formatForDateTimeInput(dateObj) {
        if (!dateObj) return '';
        // Adjusts for local timezone offset before slicing
        const tzOffset = dateObj.getTimezoneOffset() * 60000; 
        const localISOTime = (new Date(dateObj - tzOffset)).toISOString().slice(0, 16);
        return localISOTime;
    }


    // ===== ACTION FUNCTIONS =====
    async function leaveTournament(tournament) {
        try {
            const response = await fetch('/api/leave_tournament', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tournamentId: tournament.id })
            });

            if (response.ok) {
                closeAllPopups();
                window.location.reload(); 
            } else {
                const errorData = await response.json(); 
                closeAllPopups();
                showErrorPopup(errorData.error || "Wystąpił nieznany błąd.");
            }
        } catch (error) {
            closeAllPopups();
            showErrorPopup("Błąd połączenia z serwerem.");
        }
    };

    async function kickPlayer(tournamentId, targetPlayerId, tournamentsData) {
        try {
            const res = await fetch('/api/kick_player', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tournament_id: tournamentId,
                    target_player_id: targetPlayerId
                })
            });

            if (res.ok) {
                showTournamentPopup(tournamentId, tournamentsData); 
            } else {
                const err = await res.json();
                closeAllPopups();
                showErrorPopup(err.error || "Błąd podczas wyrzucania gracza.");
            }
        } catch (error) {
            console.error(error);
            closeAllPopups();
            showErrorPopup("Błąd połączenia z serwerem.");
        }
    }

    async function deleteTournament(tournamentId) {
        try {
            const res = await fetch('/api/delete_tournament', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tournament_id: tournamentId })
            });

            if (res.ok) {
                closeAllPopups();
                // Reload the page to remove the deleted tournament from the UI
                window.location.reload(); 
            } else {
                const err = await res.json();
                closeAllPopups();
                showErrorPopup(err.error || "Błąd podczas usuwania turnieju.");
            }
        } catch (error) {
            console.error(error);
            closeAllPopups();
            showErrorPopup("Błąd połączenia z serwerem.");
        }
    }

    async function deleteEvent(eventId, onSuccessCallback) {
        try {
            const response = await fetch('/api/event_delete', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: eventId })
            });

            const result = await response.json();

            if (!response.ok || result.error) {
                throw new Error(result.error || "Nie udało się usunąć wydarzenia.");
            }

            closeAllPopups();
            if (onSuccessCallback) onSuccessCallback();

        } catch (error) {
            closeAllPopups();
            showErrorPopup(error.message);
        }
    }

    // ===== Initialize the UI ======
    renderHeader();
    handleTabs();

    if (loadingContainer) {
        container.removeChild(loadingContainer);
    }
});