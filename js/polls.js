import { formatRelativeTimePL } from "./utils/formatDate.js";
import { adjustModalPosition, debounce, getParamsUrl, requireAuth } from "./utils/helpers.js";

(async () => {

    // Placeholder poll
    const poll = {
        id: "3221",
        end_date: "2026-07-05T13:19:00.000Z",
        labels: [
            {id:"423", name: "Planszówka", hex: "f7ff80", description: "Gra planszowa itp."},
            {id:"519", name: "Gra wideo", hex: "84ff80", description: "Fajna gierka i takie tam."}
        ]
    }

    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `polls?${paramsUrl}`;

    // Authenticate user
    const userAuthenticated = await requireAuth(pageUrl);
    if (!userAuthenticated) return;





    function renderHeader() {
        const relativeEl = document.querySelector('#poll_date_relative');

        const relativeDate = formatRelativeTimePL(poll.end_date);
        const formattedDate = new Intl.DateTimeFormat('pl-PL', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(new Date(poll.end_date));

        relativeEl.textContent = relativeDate;
        relativeEl.title = formattedDate;

        const labelsListContainerEl = document.querySelector('#poll_labels_list_container');
        const labelsListEl = document.querySelector('#poll_labels_list');
        const labelsListToggleBtn = document.querySelector('#btn_toggle_labels_menu');

        labelsListToggleBtn.onclick = () => {
            labelsListToggleBtn.classList.toggle('btn_active');
            labelsListContainerEl.classList.toggle('hidden');
            adjustModalPosition(labelsListContainerEl);
        }

        let labelsHtml = ''
        const labels = poll.labels;
        labels.forEach((label) => {
            const questionWithLabel = 12; // TODO: add counter of question with this label
            labelsHtml+=`
                <div class="labels_list_label" data-id="${label.id}">
                    <div class="labels_list_label_hex">
                        <div class="labels_list_label_hex_dot" style="background-color: #${label.hex};"></div>
                    </div>
                    <div class="labels_list_label_title">
                        <div class="labels_list_label_name">${label.name}</div>
                        <div class="labels_list_label_description">${label.description}</div>
                    </div>
                    <div class="labels_list_label_counter">
                        ${questionWithLabel}
                    </div>
                </div>
            `
        })

        labelsListEl.insertAdjacentHTML('beforeend', labelsHtml);

        const labelBtns = document.querySelectorAll('.labels_list_label')
        labelBtns.forEach((btn) => {
            const labelId = btn.getAttribute('data-id');
            btn.onclick = () => showLabelEditor(labelId);
        })

        document.querySelector('#poll_labels_list_new').onclick = () => createNewLabel()

        // TODO: Label Editor
        function showLabelEditor(labelId) {
            const label = poll.labels.find(l => l.id === labelId);
            window.alert(`Edit label: ${label.name}`);
        }

        // TODO: Create label
        function createNewLabel() {
            window.alert(`Create new label in: ${poll.id}`);
        }
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


    renderHeader();

})()
