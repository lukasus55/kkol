import { formatForDateTimeInput, formatRelativeTimePL } from "./utils/formatDate.js";
import { adjustModalPosition, appendLoaderDiv, cloneArray, debounce, ensureAbsoluteUrl, getParamsUrl, isEqual, loadData, postData, requireAuth } from "./utils/helpers.js";

const CONTAINER = document.querySelector('#poll');
const loadingContainer = document.querySelector('#loader-global');

async function renderPage() {
    // Handling params
    const params = new URLSearchParams(window.location.search);
    const paramsUrl = getParamsUrl(params);
    const pageUrl = `poll?${paramsUrl}`;

    const pid = params.get('p');
    if (!pid) {
        window.location.replace('/dashboard?tab=polls');
        return;
    }


    // Verifying if poll exists
    const pollData = await loadData(`/api/polls?id=${pid}`);

    if (!pollData || pollData.length === 0) {
        console.warn(`Ankieta nie istnieje.`);
        document.querySelector('#poll').innerHTML = `<div class="poll_not_found"> Ankieta nie istnieje. </div>`;
        return;
    }

    const POLL = pollData[0];

    if (!POLL) {
        console.error(`Błąd przy ładowaniu ankiety: ${pollData.error || `Nieznany błąd.`}`)
        CONTAINER.innerHTML = `<div class="poll_not_found"> Ankieta nie istnieje. </div>`;
        return;
    }

    // Authenticate & Fetch user
    const userAuthenticated = await requireAuth(pageUrl);
    if (!userAuthenticated) return;

    const userData = await loadData('/api/me');
    const USER = userData.user;


    const modeParam = params.get('m');
    let MODE;
    switch (modeParam) {
        case "r":
            MODE = "results"
            break;
        case "e":
            MODE = "edit"
            break;
        default:
            MODE = "vote"
            break;
    }

    function getMode() {
        return MODE;
    }

    // Fetching detailed data
    let [LABELS, fetchedQuestions] = await Promise.all([
        loadData(`/api/poll_labels?poll=${pid}`),
        loadData(`/api/poll_questions?poll=${POLL.id}`)
    ])

    let QUESTIONS = cloneArray(fetchedQuestions);
    const CHANGES_MODAL = document.querySelector('#changes_popup');

    // async function reFetchQuestions() {
    //     fetchedQuestions = await loadData(`/api/poll_questions?poll=${POLL.id}`);
    //     QUESTIONS = cloneArray(fetchedQuestions);
    // }


    // Render header
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



        function renderModeSelector() {
            const modeEl = document.querySelector('#poll_tools_mode');
            modeEl.innerHTML = `
                <div class="tooltip_container">
                    <button class="btn_transparent btn_page_mode ${MODE === "vote" && `selected`}" data-id="vote">
                        <img src="img/polls/vote.svg">
                    </button>
                    <span class="tooltip_popup">Tryb głosowania</span>
                </div>
                <div class="tooltip_container">
                    <button class="btn_transparent btn_page_mode ${MODE === "results" && `selected`}" data-id="results">
                        <img src="img/polls/graph.svg">
                    </button>
                    <span class="tooltip_popup">Tryb wyników</span>
                </div>
                <div class="tooltip_container">
                    <button class="btn_transparent btn_page_mode ${MODE === "edit" && `selected`}" data-id="edit">
                        <img src="img/polls/pencil.svg">
                    </button>
                    <span class="tooltip_popup">Tryb edycji</span>
                </div>
            `


            const modeBtns = document.querySelectorAll('.btn_page_mode');
            modeBtns.forEach((btn) => {
                handleModeButton(btn)
            })

            function handleModeButton(btn) {
                const modeId = btn?.getAttribute('data-id');

                // Manually changing selected classlist instead of calling renderModeSelector() in changeMode()
                // to prevent tooltip flickering.
                btn.onclick = () => {
                    if (notAppliedChanges()) {
                        shakeChangesModal();
                        return;
                    }

                    modeBtns.forEach((btn) => {
                        btn.classList.remove(`selected`);
                    })
                    btn.classList.add(`selected`);
                    changeMode(modeId);
                };
            }

            /**
             * Changes page mode
             * @param {string} m "vote" || "results" || "edit"
             */
            function changeMode(m) {
                if (m !== "vote" && m !== "results" && m !== "edit") {
                    console.error("Incorrect mode");
                    return;
                }

                MODE = m;

                renderMain(false);
                renderFooter()

                return;
            }
        };
        renderModeSelector();

        async function renderLabels() {
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
            let previewLabel = { id: "0", name: "Etykieta", hex: "#ffffff", description: "" }
            document.querySelector('#poll_labels_list_new').onclick = () => showLabelEditor(newLabel, true)

            function showLabelEditor(label, isCreateMode = false) {

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
                descInput.oninput = () => { previewLabel.description = descInput.value }; // No need to use setPreviewLabel here because desc change doesn't update anything on the preview. 
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

                /// --- FUNCTIONS ---
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
                    if (key !== 'hex') { document.querySelector('#label_edit_color').value = previewLabel.hex };
                }

                async function saveLabel(label) {
                    try {
                        const payload = {
                            id: label.id,
                            name: nameInput.value,
                            hex: colorInput.value,
                            description: descInput.value
                        };
                        const result = await postData('/api/poll_label_update', payload, "Nie udało się edytować etykiety.");
                        window.location.reload();

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Label creation failed:", error);
                    }
                }

                async function deleteLabel(label) {
                    try {
                        const payload = {
                            id: label.id,
                        };
                        const result = await postData('/api/poll_label_delete', payload, "Nie udało się usunąć etykiety.");
                        window.location.reload();

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Label deletion failed:", error);
                    }
                }

                async function createNewLabel() {
                    try {
                        const payload = {
                            poll: POLL.id,
                            name: nameInput.value,
                            hex: colorInput.value,
                            description: descInput.value
                        };
                        const result = await postData('/api/poll_label_create', payload, "Nie udało się utworzyć etykiety.");
                        window.location.reload();

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Label creation failed:", error);
                    }
                }
            }

        }

        async function renderSettings() {
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
                levelInput.selectedIndex = POLL.rights_level - 1; // rights_level=1 === index=0 cause there's no 'Not selected default option'


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

        window.onscroll = () => {
            const nameRow = document.querySelector("#poll_name_row");
            const dateRow = document.querySelector("#poll_date_row");


            if (window.scrollY > 0) {
                nameRow.classList.remove('poll_header_visible');
                nameRow.classList.add('poll_header_hidden');
                dateRow.classList.remove('poll_header_visible');
                dateRow.classList.add('poll_header_hidden');
            } else {
                nameRow.classList.add('poll_header_visible');
                nameRow.classList.remove('poll_header_hidden');
                dateRow.classList.add('poll_header_visible');
                dateRow.classList.remove('poll_header_hidden');
            }
        };


        renderLabels();
        renderSettings();
    }




    /**
     * Renders the main content.
     * @param {boolean} fullReRender - Should be 'true' only when adding or removing new questions.
     */
    async function renderMain(fullReRender = true) {

        let Q_CONTAINER = document.querySelector('#questions_container');
        const R_CONTAINER = document.querySelector('#results_container');

        R_CONTAINER.innerHTML = "";

        if (fullReRender) {
            Q_CONTAINER.remove();

            Q_CONTAINER = document.createElement("div");
            Q_CONTAINER.id = "questions_container";
            Q_CONTAINER.classList.add(`questions_container`);

            document.querySelector(`#poll_container`).append(Q_CONTAINER);
        }

        const isEditMode = MODE === "edit";

        if (MODE === "results") {
            Q_CONTAINER.classList.add('hidden');
            R_CONTAINER.innerHTML = 'TODO: Results pannel';
        } else {
            Q_CONTAINER.classList.remove('hidden');
            renderQuestions();
        }


        async function renderQuestions() {
            console.log(QUESTIONS)
            QUESTIONS.forEach((q) => {
                renderQuestion(q);
            })

            function renderQuestion(q) {
                const isMultipleChoice = q.multiple_choice;

                const existingQEl = document.querySelector(`#question-${q.id}`);
                if (!existingQEl) {
                    Q_CONTAINER.insertAdjacentHTML('beforeend',
                        `<div class="question" id="question-${q.id}" data-id="${q.id}"> </div>`
                    );
                }

                const qEl = document.querySelector(`#question-${q.id}`);
                qEl.draggable = isEditMode;
                qEl.style.cursor = isEditMode ? `grabbing` : `default`;

                qEl.innerHTML = `

                        <div class="question_header">
                            <div class="question_left"> 
                                ${isEditMode ? `
                                    <div class="question_left_edit"> 
                                        <div>
                                            <input class="question_input question_header_input question_name_input ${!q.name && `input_incorrect`}" value="${q.name}" placeholder="Pytanie">
                                        </div>
                                        <div>
                                            <input class="question_input question_header_input question_page_input" value="${q.page_url || ``}" placeholder="Link (opcjonalne)">
                                        </div>
                                    </div>
                                ` : `
                                    <div class="question_left_view">
                                        <h2 class="question_name"> 
                                            ${q.name}
                                        </h2>
                                        ${q.page_url ?
                        `<h5 class="question_page"> 
                                                <a href=${ensureAbsoluteUrl(q.page_url)} target="_blank"> ${q.page_url} </a>
                                            </h5>`
                        : ``}
                                    </div>
                                `
                    }
                            </div>

                            <div class="question_mode">

                                ${isEditMode ?
                        `<div class="tooltip_container" draggable="false">
                                    <button class="btn_delete_question">
                                        <img src="img/polls/trash.svg">
                                    </button>
                                    <span class="tooltip_popup">Usuń pytanie</span>
                                </div>` : ``}
                                
                                <div class="tooltip_container">
                                    <button class="question_mode_toggle_btn poll_btn ${!isEditMode && `disabled`}" ${!isEditMode && `disabled`}>
                                        <div class="question_mode_toggle_icon">
                                            <div class="question_mode_toggle_shape ${isMultipleChoice ? `square` : ``}"></div>
                                        </div>
                                    </button>
                                    <span class="tooltip_popup mult_choice_tooltip_popup">${isMultipleChoice ? `Pytanie wielokrotnego wyboru` : `Pytanie jednokrotnego wyboru`}</span>
                                </div>
                            </div>

                        </div>
                        <div class="question_labels">
                            
                        </div>
                        <div class="question_answers"> 
                            TODO: Options
                        </div>

                `

                if (isEditMode) {
                    document.querySelector(`#question-${q.id} .btn_delete_question`).onclick = () => deleteQuestion(q);
                    document.querySelector(`#question-${q.id} .question_mode_toggle_btn`).onclick = () => changeQuestionMode(q);
                    document.querySelector(`#question-${q.id} .question_page_input`).oninput = (e) => changeQuestionUrl(q, e.target.value)
                    document.querySelector(`#question-${q.id} .question_name_input`).oninput = (e) => changeQuestionName(q, e.target.value)
                }

                async function deleteQuestion(q) {
                    if (notAppliedChanges()) {
                        shakeChangesModal();
                        return;
                    }

                    try {
                        const payload = {
                            id: q.id,
                        };
                        const result = await postData('/api/poll_question_delete', payload, "Nie udało się usunąć pytania.");
                        document.querySelector(`#question-${q.id}`).remove();
                        return;

                    } catch (error) {
                        showErrorPopup(error.message);
                        console.error("Question deletion failed:", error);
                    }
                }

                function changeQuestionMode(q) {
                    const newIsMult = !q.multiple_choice;

                    const shape = document.querySelector(`#question-${q.id} .question_mode_toggle_shape`);
                    shape.classList.toggle('square');

                    const tooltipEl = document.querySelector(`#question-${q.id} .question_mode .mult_choice_tooltip_popup`)
                    tooltipEl.textContent = newIsMult ? `Pytanie wielokrotnego wyboru` : `Pytanie jednokrotnego wyboru`;

                    q.multiple_choice = newIsMult;
                    document.dispatchEvent(EDIT_EVT);
                    return;
                }

                function changeQuestionUrl(q, value) {
                    q.page_url = value || null;
                    document.dispatchEvent(EDIT_EVT);
                }

                function changeQuestionName(q, value) {
                    const nameInput = document.querySelector(`#question-${q.id} .question_name_input`);

                    if (value) {
                        nameInput.classList.remove('input_incorrect');
                    } else {
                        nameInput.classList.add('input_incorrect');
                    }

                    q.name = value;
                    document.dispatchEvent(EDIT_EVT);
                }

            }

            handleTooltips();
            if (!fullReRender) return;

            function handleDragging() {
                const questionItems = document.querySelectorAll('.question');

                // A transparent 1x1 pixel image to feed to the native API
                const transparentImg = new Image();
                transparentImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

                let customGhost = null;
                let offsetX = 0;
                let offsetY = 0;

                questionItems.forEach(item => {

                    item.addEventListener('mousedown', (e) => {
                        // If the target is an input or inside a button, disable dragging
                        if (e.target.tagName === 'INPUT' || e.target.closest('button')) {
                            item.draggable = false;
                        } else {
                            item.draggable = true;
                        }
                    });

                    item.addEventListener('dragstart', e => {
                        // Not using isEdit mode here cause isEdit can be outdated when !fullReRender
                        if (item.draggable === false || getMode() !== "edit") {
                            e.preventDefault();
                            return;
                        }

                        item.classList.add('is_dragging');

                        const rect = item.getBoundingClientRect();
                        offsetX = e.clientX - rect.left;
                        offsetY = e.clientY - rect.top;

                        customGhost = item.cloneNode(true);
                        customGhost.classList.add('custom_drag_ghost');

                        // Lock original width so it doesn't collapse
                        customGhost.style.width = `${rect.width}px`;

                        customGhost.style.left = `${e.clientX - offsetX}px`;
                        customGhost.style.top = `${e.clientY - offsetY}px`;

                        document.body.appendChild(customGhost);

                        // Hide default browser ghost
                        e.dataTransfer.setDragImage(transparentImg, 0, 0);
                    });

                    item.addEventListener('drag', e => {
                        // The HTML5 drag event sometimes fires with 0,0 right as you drop; ignore it
                        if (e.clientX === 0 && e.clientY === 0) return;

                        if (customGhost) {
                            customGhost.style.left = `${e.clientX - offsetX}px`;
                            customGhost.style.top = `${e.clientY - offsetY}px`;
                        }
                    });

                    item.addEventListener('dragend', () => {
                        item.classList.remove('is_dragging');

                        if (customGhost) {
                            customGhost.remove();
                            customGhost = null;
                        }

                        QUESTIONS = cloneArray(syncSortOrders(QUESTIONS));
                        document.dispatchEvent(EDIT_EVT);
                    });
                });

                Q_CONTAINER.addEventListener('dragover', e => {
                    e.preventDefault();

                    const afterElement = getDragAfterElement(Q_CONTAINER, e.clientY);
                    const draggable = document.querySelector('.is_dragging');

                    // If not hovering over anything, append to the bottom
                    if (afterElement == null) {
                        Q_CONTAINER.appendChild(draggable);
                    } else {
                        Q_CONTAINER.insertBefore(draggable, afterElement);
                    }
                });

                // Math helper to figure out cursor placement
                function getDragAfterElement(Q_CONTAINER, y) {
                    const draggableElements = [...Q_CONTAINER.querySelectorAll('.question:not(.is_dragging)')];

                    return draggableElements.reduce((closest, child) => {
                        const box = child.getBoundingClientRect();
                        const offset = y - box.top - box.height / 2;

                        // If cursor is above the center point - drop it here
                        if (offset < 0 && offset > closest.offset) {
                            return { offset: offset, element: child };
                        } else {
                            return closest;
                        }
                    }, { offset: Number.NEGATIVE_INFINITY }).element;
                }
            }

            handleDragging();
        }

    }

    function renderFooter() {
        const createQBtn = document.querySelector('#btn_new_question');

        if (getMode() !== "edit") {
            createQBtn.classList.add('hidden');
            return;
        }

        createQBtn.classList.remove('hidden');
        createQBtn.onclick = () => { createQuestion() };

        async function createQuestion() {
            QUESTIONS.push({
                id: `temp-id-${QUESTIONS.length + 1}`,
                added_on: null,
                creator_id: USER.id,
                multiple_choice: false,
                name: `Pytanie ${QUESTIONS.length + 1}`,
                page_url: null,
                poll_id: POLL.id,
                sort_order: null,
            });

            document.dispatchEvent(EDIT_EVT);
            renderMain(true);
        }

    }

    function renderChangesModal() {
        document.querySelector(`#changes_reset`).onclick = () => resetChanges();
        document.querySelector(`#changes_save`).onclick = () => saveChanges();

        function resetChanges() {
            QUESTIONS = cloneArray(fetchedQuestions);
            renderMain(true);
            document.dispatchEvent(EDIT_EVT);
        }

        function saveChanges() {
            if (getMode() === 'edit') {
                updateQuestions()
            } else {
                // TODO
                // updateAnswers()
            }
        }

        function updateQuestions() {

            console.log(QUESTIONS)
        }

    }

    function shakeChangesModal() {
        CONTAINER.classList.add(`shaked`);
        CHANGES_MODAL.classList.add(`changes_popup_highlited`);
        setTimeout(
            () => {
                CONTAINER.classList.remove(`shaked`);
                CHANGES_MODAL.classList.remove(`changes_popup_highlited`);
            }
        , 500);
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
        document.getElementById('error_close_btn').onclick = () => { popup.classList.remove('active') };
    }

    function syncSortOrders(questionsArray) {
        const domQuestions = document.querySelectorAll('.question');

        domQuestions.forEach((element, index) => {
            const questionId = element.dataset.id;

            const questionObj = questionsArray.find(q => q.id === questionId);

            if (questionObj) {
                questionObj.sort_order = index + 1;
            } else {
                console.warn("No question obj found!");
            }
        });

        questionsArray.sort((a, b) => a.sort_order - b.sort_order);
        return questionsArray;
    }





    // ====== UI HANDLERS ======

    const EDIT_EVT = new CustomEvent("changesEvent")

    document.addEventListener("changesEvent", changesEventHandler);

    function notAppliedChanges() {
        return !isEqual(QUESTIONS, fetchedQuestions)
    }

    function changesEventHandler() {
        if (notAppliedChanges()) {
            CHANGES_MODAL.classList.remove('changes_popup_hidden');
        } else {
            CHANGES_MODAL.classList.add('changes_popup_hidden');
        }
    }


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
        button.addEventListener('click', function () {
            const overlay = this.closest('.popup_overlay');
            if (overlay) { overlay.classList.remove('active'); }
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
            if (event.target === popup) { popup.classList.remove('active'); }
        };
    }

    function handleTooltips() {
        const targetElements = document.querySelectorAll('.tooltip_container');

        targetElements.forEach(element => {
            const popup = element.querySelector('.tooltip_popup');

            element.addEventListener('mouseenter', () => {

                if (popup) {
                    popup.classList.add('tooltip_visible');
                }
            });

            element.addEventListener('mouseleave', () => {
                if (popup) {
                    popup.classList.remove('tooltip_visible');
                }
            });
        });
    }

    window.addEventListener('resize', handleMenuResize);



    renderHeader();
    renderMain();
    renderFooter();
    renderChangesModal();


}

await renderPage();
CONTAINER.removeChild(loadingContainer);