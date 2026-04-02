import { createLogoutButton, loadData, requireAuth } from "./helpers.js";


function handleHeader(user) {
    const id = user.id;
    const displayedName = user.displayed_name;
    const roleId = user.role

    const profilePicture = document.querySelector('#player_pfp')
    const nameDiv = document.querySelector('#player_name');
    const roleDiv = document.querySelector('#player_role');

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
}

function handleTabs() {

    let currentTab = 'account';
    const tabs = document.querySelectorAll('.selector ul li');

    function tabChange(tab) {
        const tabId = tab.id.replace('selector_','');
        currentTab = tabId

        document.querySelector('.selector ul li.active')?.classList.remove('active');
        tab.classList.add('active');

        document.querySelector('.content .tab_content.active')?.classList.remove('active');
        const tabContent = document.querySelector(`#content_${tabId}`);
        tabContent.classList.add('active');
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', async () => {
            tabChange(tab);
        })
    });

}

document.addEventListener('DOMContentLoaded', async () => {
    
    const container = document.querySelector('body');
    const loadingContainer = document.querySelector('#loader-global')

    const userAuthenticated = await requireAuth();
    if (!userAuthenticated) return;

    const userData = await loadData('/api/me');
    const user = userData.user;

    const logoutBtn = document.querySelector('#logout_btn');
    createLogoutButton(logoutBtn, container);

    handleHeader(user)
    handleTabs();

    container.removeChild(loadingContainer);

});