import { formatRelativeTimePL } from "./utils/formatDate.js";
import { adjustModalPosition, debounce, getParamsUrl, requireAuth } from "./utils/helpers.js";

(async () => {

    // Placeholder poll
    const POLL = {
        id: "3221",
        end_date: "2026-07-05T13:19:00.000Z",
        labels: [
            { id: "423", name: "Planszówka", hex: "f7ff80", description: "Gra planszowa itp." },
            { id: "519", name: "Gra wideo", hex: "84ff80", description: "Fajna gierka i takie tam." }
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

        const relativeDate = formatRelativeTimePL(POLL.end_date);
        const formattedDate = new Intl.DateTimeFormat('pl-PL', {
            day: '2-digit', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        }).format(new Date(POLL.end_date));

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
        const labels = POLL.labels;
        labels.forEach((label) => {
            const questionWithLabel = 12; // TODO: add counter of question with this label
            labelsHtml += `
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
            const label = POLL.labels.find(l => l.id === labelId);
            if (!label) {
                // TODO: Error popup
                console.error('Label not found')
            }

            document.querySelector('#popup_label_editor').classList.add('active');

            const badgeEl = document.querySelector('#label_editor_badge');
            const colors = getLabelColors(label.hex);

            document.querySelector('#label_edit_name').value = label.description;
            document.querySelector('#label_edit_desc').value = label.name;
            document.querySelector('#label_edit_color').value = `#${label.hex}`;

            badgeEl.textContent = label.name;
            badgeEl.style.color = colors.textColor;
            badgeEl.style.borderColor = colors.textColor;
            badgeEl.style.backgroundColor = colors.backgroundColor;
            document.querySelector('#label_color_rect').style.backgroundColor = `#${label.hex}`;

        }

        // TODO: Create label
        function createNewLabel() {
            window.alert(`Create new label in: ${POLL.id}`);
        }
    }




    // ====== UTILS ======

    /**
     * Generates solid dark background and tinted white text/border hex colors.
     * @param {string} hex - The base input hex color (e.g., '#d73a4a')
     * @returns {{ backgroundColor: string, textColor: string }}
     */
    function getLabelColors(hex) {
        const cleanHex = hex.replace('#', '');

        const r = parseInt(cleanHex.substring(0, 2), 16);
        const g = parseInt(cleanHex.substring(2, 4), 16);
        const b = parseInt(cleanHex.substring(4, 6), 16);

        const toHex = (value) => {
            const hexStr = Math.round(value).toString(16);
            return hexStr.length === 1 ? `0${hexStr}` : hexStr;
        };

        // Background: Mix 15% of the base color with 85% black
        const bgWeight = 0.15;
        const bgR = r * bgWeight;
        const bgG = g * bgWeight;
        const bgB = b * bgWeight;
        const backgroundColor = `#${toHex(bgR)}${toHex(bgG)}${toHex(bgB)}`;

        // Text/Border: Mix 20% of the base color with 70% white
        const textWeight = 0.7;
        const textR = r + (255 - r) * textWeight;
        const textG = g + (255 - g) * textWeight;
        const textB = b + (255 - b) * textWeight;
        const textColor = `#${toHex(textR)}${toHex(textG)}${toHex(textB)}`;

        return {
            backgroundColor,
            textColor
        };
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

    function closeAllPopups(exception = null) {
        const activePopups = document.querySelectorAll('.popup_overlay.active');

        const isException = (element) => {
            if (!exception) return false;

            // Handle if exception is an array or NodeList
            if (Array.isArray(exception) || exception instanceof NodeList) {
                return Array.from(exception).includes(element);
            }

            // Handle if exception is a single DOM node
            return element === exception;
        };

        activePopups.forEach(popup => {
            if (!isException(popup)) {
                popup.classList.remove('active');
                // Ensures even worst browsers will move unused .onClick events to garbage.
                popup.outerHTML = popup.outerHTML;
            }
        });
    }

    // Close on Escape key press
    document.onkeydown = (event) => {
        if (event.key === 'Escape') {
            const isAnyPopupOpen = document.querySelectorAll('.popup_overlay.active').length > 0;
            if (isAnyPopupOpen) { closeAllPopups() }
            else { closeAllActionMenus() };
        }
    }

    // Close on outside click
    document.onmousedown = (event) => {
        const isInsideMenu = event.target.closest('.poll_action_menu:not(.hidden)');
        const isInsidePopup = event.target.closest('.popup_container');
        const isAnyPopupOpen = document.querySelectorAll('.popup_overlay.active').length > 0;

        console.log(isAnyPopupOpen)
        if (!isInsideMenu && !isAnyPopupOpen) { closeAllActionMenus(); }
        if (!isInsidePopup) { closeAllPopups(); }
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
