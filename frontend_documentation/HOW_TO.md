# HOW TO Page for Frontend Build

## Running the App Locally

To get the application up and running on your local machine, follow these steps:

1.  **Initial Setup**: Run the setup script from the root directory to install all dependencies (Python and Node.js) and set up the virtual environment.
    ```bash
    ./setup.sh
    ```
2.  **Start the Backend**:
    ```bash
    source .venv/bin/activate
    cd backend/aos
    python api.py
    ```
3.  **Start the Frontend**: Open a new terminal window and run:
    ```bash
    cd frontend-next
    npm run dev
    ```
    The app will be available at [http://localhost:3000](http://localhost:3000).

## Adding New Page

The frontend uses Next.js App Router with dynamic routing for class guides. Most "pages" are generated dynamically based on the structure in `src/lib/guide_config.ts`.

If you need to add a completely new, unique page (e.g., an "About" page):
1.  Create a new directory in `src/app/` (e.g., `src/app/about/`).
2.  Create a `page.tsx` file inside that directory.
3.  Add any necessary styling in a `page.module.css` file.

## Adding New Content 

To add new class guides or update existing ones:

1.  **Create Markdown File**: Add your content in a new `.md` file within the `class_guides/` directory. Follow the naming convention (e.g., `class_guides/ninja/awakening/ninja_awakening_combos_pvp.md`).
2.  **Formatting**: If the content is a combo guide, use the following header structure for automatic parsing:
    *   `## Combo Name`
    *   `### Description`
    *   `### Inputs w/ Move Names`
    *   `### Inputs w/ Keybinds` (Use `→` to separate steps)
3.  **Register in Guide Config**: Open `src/lib/guide_config.ts` and add an entry for your new file in the `GUIDE_TREE` object. This will automatically add it to the sidebar and generate the necessary routes.

## Run Build

To create a production-ready build of the frontend:

1.  Navigate to the frontend directory:
    ```bash
    cd frontend-next
    ```
2.  Run the build command:
    ```bash
    npm run build
    ```
    This command will run linting, type checking, and generate optimized static pages.

