# Karwińska Olimpiada - AI Agents Guidelines

## 1. Extracting and Using Common Components
During any refactor or when building new views (e.g., Dashboard, Polls), actively look for opportunities to extract and **use** universal UI components, such as:
- **Buttons** (`Button.tsx` with variants: Primary, Secondary, Tertiary, Danger)
- **Modals / Popups** (`Modal.tsx` for universal dialogs with props for title, content, actions)
- **Inputs** (`Input.tsx` for text fields, passwords with eye toggle, validators)
- **Cards** (`Card.tsx` for universal container layout with specific background and border)

**CRITICAL:** Agents must actively search for opportunities to use these common components. Before making any major UI changes, you MUST read and familiarize yourself with the `/components/ui/` directory to check what reusable components already exist. Avoid creating raw HTML elements (like raw `<button>`, `<input>`) if a suitable UI component exists. 

Universal components should be placed in the `components/ui/` folder and use Tailwind CSS. The goal is to achieve full visual consistency and DRY (Don't Repeat Yourself) across all new parts of the application.

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
