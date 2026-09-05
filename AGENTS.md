# Karwińska Olimpiada - AI Agents Guidelines

## 1. ABSOLUTELY CRITICAL: Use Existing Shared UI Components
**DO NOT CREATE RAW HTML ELEMENTS** (like raw `<button>`, `<input>`, native `alert()` or `confirm()`) unless absolutely necessary and no equivalent component exists.

Whenever you add or modify a view, you **MUST FIRST check the `components/ui/` directory** for reusable components. We already have robust, styled abstractions that you **MUST use**, including but not limited to:
- **Buttons** (`Button.tsx` for all actions. DO NOT use raw `<button>`)
- **Confirmation Dialogs** (`ConfirmationPopup.tsx` - DO NOT use browser native `confirm()`)
- **Modals / Popups** (`Modal.tsx` for general popups)
- **Inputs** (`Input.tsx` for text/passwords)
- **Selects** (`Select.tsx` for dropdowns)
- **Cards** (`Card.tsx` for layout containers)

**MANDATORY RULE:** Every future AI agent is explicitly forbidden from generating new raw buttons, native alerts, or native confirmation popups if a UI component can do the job. The primary goal of this architecture is DRY (Don't Repeat Yourself) and 100% visual consistency.

## 2. Popup / Modal Closing Rules
Every newly created or refactored popup/modal must adhere to the following 3 closing rules:
1. Close via a visible button (e.g., an "X" in the corner or a "Close" button).
2. Close by clicking outside the popup window (clicking on the darkened background/backdrop).
3. Close by pressing the "ESC" key on the keyboard.
*(Note: Using the existing `Modal.tsx` component usually handles these rules automatically).*

## 3. Backend Testing and Documentation
When you edit, modify, or create any backend file (e.g., API endpoints in `pages/api/`), **you must always**:
1. **Write or update rigorous unit tests for them.**
   - Tests are located in the `__tests__/api/` folder.
   - Use the `vitest` environment and `node-mocks-http` to simulate requests.
   - Remember to mock database queries (`vi.hoisted` + `vi.mock('../../db.js')`).
   - Carefully check *edge cases* (invalid data, missing permissions, validations).
   - **After any major backend modifications, you are required to run the `npx vitest run` command in the terminal** to verify everything works correctly.
2. **Create or update Swagger (JSDoc) documentation** at the top of every modified endpoint file. Example: `/** @swagger ... */`. Ensure that all API endpoints have precise definitions of returned codes and parameters. Future agents MUST create and update Swagger documentation.

## 4. Database Structure
The `types/db.ts` file can serve as a preview of the database structure. Treat it as a useful guide, but remember that it is not a perfect reflection of the database (e.g., it doesn't contain exact information about foreign keys or constraints). You can always look at it to understand the general outline of the data models.

## 5. Flat Design & Border Minimization
The KKOL application is based on **flat design**. 
- Avoid using deep shadows (`shadow-md`, `shadow-lg`, `shadow-xl`, etc.). Instead of shadows, use subtle differences in background shades (`bg-bg-100` vs `bg-bg-200`) to separate elements and containers from the background.
- **Minimize the use of borders**. Whenever possible, separate sections or components using different background colors rather than adding a border. Borders (`border`, `border-bg-400`, etc.) should only be used as a last resort when color separation is not enough or when creating form inputs.
Aim for visual minimalism without spatial effects and heavy outlines.

## 6. Maximum Border Radius
In accordance with the adopted aesthetic, avoid using large border radii (such as `rounded-lg`, `rounded-xl`, `rounded-2xl`, or `rounded-3xl`) for general containers, cards, popups, or buttons.
The maximum value you should use for such elements is **`rounded-md`**.
Fully rounded elements (e.g., `rounded-full` for profile pictures) are still allowed where logically justified, but do not use them for interface blocks (e.g., buttons should remain at a maximum of `rounded-md`).

## 7. React File Length & Component Modularity
Aim for clean, modular, and easy-to-maintain React components:
- **Target (<150 lines)**: Aim to keep React component files under 150 lines. Extract subcomponents, custom hooks, helper utilities, and constants into dedicated files.
- **Acceptable (150-300 lines)**: Files in this range are acceptable, but you must actively consider whether subcomponents, hooks, or pure helper functions can be cleanly split out.
- **Strict Limit (>300 lines)**: Components exceeding 300 lines are an absolute last resort. Whenever a file approaches or exceeds this limit, you must refactor and decompose it into smaller, focused modules.

