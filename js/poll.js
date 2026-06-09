import { formatForDateTimeInput, formatRelativeTimePL } from "./utils/formatDate.js";
import { adjustModalPosition, debounce, getParamsUrl, loadData, postData, requireAuth } from "./utils/helpers.js";

(async () => {

    // Handling params
    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `poll?${paramsUrl}`;

    const pid = params.get('p');
    if (!pid) {
        window.location.replace('/dashboard?tab=polls');
        return;
    }

    // Fetching data
    const [pollData, LABELS] = await Promise.all([
        loadData(`/api/polls?id=${pid}`),
        loadData(`/api/poll_labels?poll=${pid}`)
    ])
    const POLL = pollData[0]

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

        document.querySelector('#poll_name').textContent = POLL.name;

        function renderLabels() {
            const labelsListContainerEl = document.querySelector('#poll_labels_list_container');
            const labelsListEl = document.querySelector('#poll_labels_list');
            const labelsListToggleBtn = document.querySelector('#btn_toggle_labels_menu');

            labelsListToggleBtn.onclick = () => {
                labelsListToggleBtn.classList.toggle('btn_active');
                labelsListContainerEl.classList.toggle('hidden');
                adjustModalPosition(labelsListContainerEl);
            }

            let labelsHtml = ''
            if (LABELS.length === 0) {
                labelsHtml = '<div class="labels_empty">Nie ma jeszcze żadnych etykiet</div>'
            } else {
                LABELS.forEach((label) => {
                    const questionWithLabel = 12; // TODO: add counter of question with this label
                    labelsHtml += `
                        <div class="labels_list_label" data-id="${label.id}">
                            <div class="labels_list_label_hex">
                                <div class="labels_list_label_hex_dot" style="background-color: ${label.hex};"></div>
                            </div>
                            <div class="labels_list_label_title">
                                <div class="labels_list_label_name">${label.name}</div>
                                <div class="labels_list_label_description">${label.description || ``}</div>
                            </div>
                            <div class="labels_list_label_counter">
                                ${questionWithLabel}
                            </div>
                        </div>
                    `
                })
            }

            labelsListEl.insertAdjacentHTML('beforeend', labelsHtml);

            const labelBtns = document.querySelectorAll('.labels_list_label')
            labelBtns.forEach((btn) => {
                const labelId = btn.getAttribute('data-id');
                const label = LABELS.find(l => l.id === labelId);
                btn.onclick = () => showLabelEditor(label);
            })

            const newLabel = { name: "", hex: getRandomHex(), description: "" };
            let previewLabel = { id: "0", name: "Etykieta", hex: "#ffffff", description: ""}
            document.querySelector('#poll_labels_list_new').onclick = () => showLabelEditor(newLabel, true)

            function showLabelEditor(label, isCreateMode=false) {

                // --- Initialize ---
                if (!label) {
                    // TODO: Error popup
                    console.error('Label not found');
                    return;
                }
                previewLabel = label;

                document.querySelector('#popup_label_editor').classList.add('active');

                /// --- Header ---
                document.querySelector('#label_editor_title').textContent = isCreateMode ? 'Utwórz etykietę' : 'Edytuj etykietę';

                /// --- Main ---
                const nameInput = document.querySelector('#label_edit_name');
                const descInput = document.querySelector('#label_edit_desc');
                const colorInput = document.querySelector('#label_edit_color');

                nameInput.value = label.name;
                descInput.value = label.description;
                colorInput.value = label.hex;
                nameInput.oninput = () => setPreviewLabel('name', nameInput.value);
                descInput.oninput = () => {previewLabel.description = descInput.value}; // No need to use setPreviewLabel here because desc change doesn't update anything on the preview. 
                colorInput.oninput = () => setPreviewLabel('hex', formatHex(colorInput.value));

                updateLabelBadge(label);

                const labelColorEl = document.querySelector('#label_color_rect');
                labelColorEl.style.backgroundColor = label.hex;
                labelColorEl.onclick = () => {
                    setPreviewLabel('hex', getRandomHex());
                    document.querySelector('#label_edit_color').value = previewLabel.hex;
                };

                // --- Footer ---
                const saveBtn = document.querySelector('#btn_save_label');
                const deleteBtn = document.querySelector('#btn_delete_label');

                saveBtn.textContent = isCreateMode ? 'Utwórz' : 'Zapisz';
                deleteBtn.style.display = isCreateMode ? 'none' : 'block';

                saveBtn.onclick = () => isCreateMode ? createNewLabel() : saveLabel(previewLabel);
                deleteBtn.onclick = () => showConfirmationPopup(
                    () => deleteLabel(previewLabel), 
                    `Czy na pewno chcesz trwale usunąć etykietę <strong>${previewLabel.name}</strong>?`,
                    "Usuń",
                    "Anuluj"
                );
            }

            function updateLabelBadge(label) {
                const badgeEl = document.querySelector('#label_editor_badge');
                const colors = getLabelColors(label.hex);
                badgeEl.textContent = label.name || 'Etykieta';
                badgeEl.style.color = colors.textColor;
                badgeEl.style.borderColor = colors.textColor;
                badgeEl.style.backgroundColor = colors.backgroundColor;
            }

            function setPreviewLabel(key, value) {
                if (previewLabel[key] === undefined) return;

                previewLabel[key] = value;

                updateLabelBadge(previewLabel);
                document.querySelector('#label_color_rect').style.backgroundColor = previewLabel.hex;
                if (key !== 'hex') {document.querySelector('#label_edit_color').value = previewLabel.hex};
            }

            // TODO
            function saveLabel(label) {
                window.alert(`Save label: ${label.name}`)
            }

            // TODO
            function deleteLabel(label) {
                window.alert(`Delete label: ${label.name}`)
            }

            // TODO
            function createNewLabel() {
                window.alert(`Create new label in: ${POLL.id}`);
            }
        }

        function renderSettings() {
            document.querySelector('#btn_poll_settings').onclick = () => showSettingsPopup();

            function showSettingsPopup() {
                document.querySelector('#popup_settings').classList.add('active');

                const nameInput = document.querySelector('#poll_edit_name');
                const startInput = document.querySelector('#poll_edit_start');
                const endInput = document.querySelector('#poll_edit_end');
                const levelInput = document.querySelector('#poll_edit_rights_level');

                nameInput.value = POLL.name;
                startInput.value = formatForDateTimeInput(POLL.start_date);
                endInput.value = formatForDateTimeInput(POLL.end_date);
                levelInput.selectedIndex = POLL.rights_level-1; // rights_level=1 === index=0 cause there's no 'Not selected default option'
                

                document.querySelector('#btn_save_poll').onclick = () => savePoll()
                document.querySelector('#btn_delete_poll').onclick = () => showConfirmationPopup(
                    () => deletePoll(), 
                    `Czy na pewno chcesz usunąć ankietę <strong>${POLL.name}</strong>?`,
                    `Usuń`,
                    `Anuluj`
                )

                // TODO
                async function savePoll() {
                    try {
                        const payload = {
                            id: POLL.id,
                            name: nameInput.value,
                            start_date: startInput.value,
                            end_date: endInput.value,
                            rights_level: levelInput.value
                        };
                        const result = await postData('/api/poll_update', payload, "Nie udało się zapisać ankiety.");
                        window.location.reload();

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Poll update failed:", error);
                    }
                }

                // TODO
                async function deletePoll() {
                    try {
                        const payload = {
                            id: POLL.id,
                        };
                        const result = await postData('/api/poll_delete', payload, "Nie udało się usunąć ankiety.");
                        window.location = '/dashboard?tab=polls';

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Poll deletion failed:", error);
                    }
                }
            }
        }

        renderLabels();
        renderSettings();

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

    /** 
     * Format hex and escape (replace with #ffffff) incorrect (not 3 or 6 long) hex 
     * @param {string} hex - Hex with #
     * @returns {string} Formatted hex with 6char
     * */
    function formatHex(hex) {
        if (hex.length === 7) return hex;
        if (hex.length === 4) return '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
        return '#ffffff';
    }

    function getRandomHex() {
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    } 

    function showErrorPopup(message = 'Nieznany błąd.') {
        const popup = document.getElementById('error_popup')
        popup.classList.add('active');

        document.getElementById('error_message').textContent = message;
        document.getElementById('error_close_btn').onclick = () => {popup.classList.remove('active')}
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
            }
        });
    }

    function closeTopPopup() {
        const activePopups = Array.from(document.querySelectorAll('.popup_overlay.active')); 
        
        if (activePopups.length === 0) return; 

        let topPopup = activePopups[0];
        let maxZIndex = parseInt(window.getComputedStyle(topPopup).zIndex) || 0;

        for (let i = 1; i < activePopups.length; i++) {
            const currentPopup = activePopups[i];
            const currentZIndex = parseInt(window.getComputedStyle(currentPopup).zIndex) || 0;
            
            // Use '>=' so that if z-indexes are equal, it picks the one later in the DOM (which visually sits on top of the earlier ones)
            if (currentZIndex >= maxZIndex) {
                maxZIndex = currentZIndex;
                topPopup = currentPopup;
            }
        }

        topPopup.classList.remove('active');
    }

    // Close on Escape key press
    document.onkeydown = (event) => {
        if (event.key === 'Escape') {
            const isAnyPopupOpen = document.querySelectorAll('.popup_overlay.active').length > 0;
            if (isAnyPopupOpen) { closeTopPopup() }
            else { closeAllActionMenus() };
        }
    }

    // Close on outside click
    document.onmousedown = (event) => {
        const isInsideMenu = event.target.closest('.poll_action_menu:not(.hidden)');
        const isInsidePopup = event.target.closest('.popup_container');
        const isAnyPopupOpen = document.querySelectorAll('.popup_overlay.active').length > 0;

        if (!isInsideMenu && !isAnyPopupOpen) { closeAllActionMenus(); }
        if (!isInsidePopup) { closeTopPopup(); }
    };

    const closeButtons = document.querySelectorAll('.poll_btn_close');
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const overlay = this.closest('.popup_overlay');
            if (overlay) {overlay.classList.remove('active');}
        });
    });

    const handleMenuResize = debounce(() => {
        const openMenus = document.querySelectorAll('.poll_action_menu:not(.hidden)');
        openMenus.forEach(menu => {
            adjustModalPosition(menu);
        });
    }, 50)

    /** 
     * Show confirmation popup
     * @param {() => void} actionCallback - Callback function
     * @param {string} message - Confirm question
     * @param {string} confirmText - Text on on confirm button
     * @param {string} cancelText - Text on cancel button
     * @returns {void} Nothing
     * */
    function showConfirmationPopup(actionCallback, message = 'Czy na pewno chcesz to zrobić?', confirmText = 'Potwierdź', cancelText = 'Anuluj') {
        const popup = document.getElementById('confirmation_popup');
        const closeBtn = document.querySelector('.btn_cancel_only_this');
        popup.classList.add('active');

        document.querySelector('#confirmation_popup_message').innerHTML = message;
        document.querySelector('#confirmation_popup_confirm').innerHTML = confirmText;
        document.querySelector('#confirmation_popup_cancel').innerHTML = cancelText;

        const confirmBtn = document.getElementById('confirmation_popup_confirm');
        confirmBtn.disabled = false;

        confirmBtn.onclick = async () => {
            confirmBtn.disabled = true;
            await actionCallback();
            popup.classList.remove('active');
        };

        popup.onclick = (event) => {
            if (event.target === popup) {popup.classList.remove('active');}
        };
    }

    window.addEventListener('resize', handleMenuResize);


    renderHeader();

})()
