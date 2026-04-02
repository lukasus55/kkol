import { loadData, requireAuth } from "./helpers.js";

document.addEventListener('DOMContentLoaded', async () => {
    
    const user = await requireAuth();
    if (!user) return;

    const userData = await loadData('/api/me');

    const id = userData.user.id;
    const displayedName = userData.user.displayed_name;
    const roleId = userData.user.role

    const profilePicture = document.querySelector('#player_pfp')
    const nameDiv = document.querySelector('#player_name');
    const roleDiv = document.querySelector('#player_role');

    console.log(userData.user);

    profilePicture.src = `/img/players/pfp/${id}.webp`;
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
    }

    const roleName = roles[roleId].name;
    const roleDescription =  roles[roleId].description;

    roleDiv.textContent = roleName;
    roleDiv.classList.add(`role_badge-${roleId}`);

});