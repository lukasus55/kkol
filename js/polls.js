import { formatRelativeTimePL } from "./utils/formatDate.js";
import { adjustModalPosition, debounce, getParamsUrl, requireAuth } from "./utils/helpers.js";

(async () => {

    // Placeholder poll
    const poll = {
        end_date: "2026-07-05T13:19:00.000Z",
        labels: [
            {name: "Planszówka", hex: "#f7ff80"},
            {name: "Gra wideo", hex: "#84ff80"}
        ]
    }

    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `polls?${paramsUrl}`;

    // Authenticate user
    const userAuthenticated = await requireAuth(pageUrl);
    if (!userAuthenticated) return;





    // ====== HEADER ======

    const relativeEl = document.querySelector('#poll_date_relative');

    const relativeDate = formatRelativeTimePL(poll.end_date);
    const formattedDate = new Intl.DateTimeFormat('pl-PL', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(new Date(poll.end_date));

    relativeEl.textContent = relativeDate;
    relativeEl.title = formattedDate;

    const labelsEditorEl = document.querySelector('#poll_labels_editor');
    const labelEditorToggleBtn = document.querySelector('#btn_toggle_labels_menu');

    labelEditorToggleBtn.onclick = () => {
        labelEditorToggleBtn.classList.toggle('btn_active');
        labelsEditorEl.classList.toggle('hidden');
        adjustModalPosition(labelsEditorEl);
    }





    // ====== UI HANDLERS ======

    function closeAllActionMenus() {
        const menus = document.querySelectorAll('.poll_action_menu');
        const menuButtons = document.querySelectorAll('.btn_menu_toggler');
        menus.forEach(menu => {
            menu.classList.add('hidden'); 
        });
        menuButtons.forEach(btn => {
            btn.classList.remove('btn_active');
        })
    }

    // Close on Escape key press
    document.onkeydown = (event) => {
        if (event.key === 'Escape') {closeAllActionMenus();}
    }

    // Close on outside click
    document.onmousedown = (event) => {
        const isInsideMenu = event.target.closest('.poll_action_menu');  
        if (!isInsideMenu) {closeAllActionMenus();}
    };

    const handleMenuResize = debounce(() => {
        const openMenus = document.querySelectorAll('.poll_action_menu:not(.hidden)');
        openMenus.forEach(menu => {
            adjustModalPosition(menu);
        });
    }, 50)

    window.addEventListener('resize', handleMenuResize);

})()
