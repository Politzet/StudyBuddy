# StudyBuddy

## What this project is

StudyBuddy is a full-stack web app I built for managing school work in one place instead of scattered notes and separate tools. After registering and logging in, you can track tasks, exams, projects, and miscellaneous items, browse a dashboard that pulls that data together, manage courses, optionally pull mock “Moodle” assignments into the app, and use a resources area that searches YouTube by course and assignment and lets you save favorites with notes.

The idea is practical: one login, persistent data in a real database, and separate screens for each kind of item so the UI stays organized.

## Main features

- **Account flow:** Register with email, username, and password; log in with email and password. The client stores a small auth payload in `localStorage` so a refresh keeps you logged in until you log out (there is no separate token UI; it is session-style usage on top of stored user info).

- **Home dashboard:** Overview of your tasks, exams, projects, and “other” items, with course filtering, counts, and highlights like upcoming exams and tasks due soon. There is a calendar modal to browse items by day.

- **Tasks:** Full list with course filter, add/edit in a modal, delete, status buttons (not started / in progress / done / blocked), and optional “study days” validation against the due date. Tasks are tied to the logged-in user on the API side.

- **Exams:** CRUD for exams with course, date, time, study days, and location (building and room).

- **Projects:** CRUD with title, course, deadline, study days, and a progress percentage you can adjust with a slider (updates persist via the API).

- **Other:** Items grouped by a category name (default “Other”), with optional deadline and open/done status.

- **Add task (dedicated form):** Route `/form` provides a longer form for adding a task plus inline course management (add / edit / delete courses) with some Hebrew labels in that section.

- **Learning hub (resources):** Picks courses and assignments from the same mock Moodle payload the sync page uses, builds search queries, calls the YouTube Data API from the browser when `VITE_YOUTUBE_API_KEY` is set, and lets you save favorites with personal notes (stored on the server per user).

- **Moodle sync:** Reads bundled mock Moodle data from the server, shows tasks, exams, and projects you can import one by one into your real collections, and records a “last sync” timestamp in client state.

- **Theme:** Light/dark preference is stored in `localStorage` and applied via a React context.

- **404:** Unknown routes show a simple not-found page.

## Tech stack

**Client**

- React (Vite as the build tool)
- React Router for navigation
- Redux Toolkit for global state (user + a small dashboard slice)
- Tailwind CSS for styling
- Framer Motion for page transitions and some UI motion
- `react-calendar` is included for calendar UI where used on the home flow

**Server**

- Node.js with Express
- Mongoose for MongoDB
- `bcrypt` for password hashing on register/login
- `cors` with logic for localhost and optional extra origins from env
- `dotenv` for `server/.env`

**Database**

- MongoDB (typically Atlas in practice), using a connection string from environment variables.

## Project structure (short guide)

- **`src/pages/`** – One file per route-level screen (login, register, home, tasks, exams, projects, other, add-task form, resources, moodle sync, 404). This is where most fetch calls, forms, and list UI live.

- **`src/components/`** – Reusable pieces: navbar, breadcrumbs, modals, dropdown, calendar modal, loaders, etc.

- **`src/hooks/`** – `useFetch` (GET + loading/error/refetch pattern) and `useLocalStorage` (JSON read/write wrapper).

- **`src/store/`** – Redux store setup, `userSlice` (auth and last task name), `dashboardSlice` (selected section label, Moodle sync time, last-created item id for a short “sparkle” highlight).

- **`src/context/`** – `ThemeContext` wraps `useLocalStorage` for theme.

- **`src/config/api.js`** – Reads `VITE_API_BASE_URL` with a localhost fallback.

- **`src/constants/`** – Shared constants such as task status labels/options.

- **`server/server.js`** – Single Express file defining routes and Mongo models usage (models live under `server/models/`).

## Routing and main pages

Public routes (no `ProtectedRoute` wrapper):

| Path | Page | Purpose |
|------|------|---------|
| `/` | Logon | Email + password login; redirects into the app after success. |
| `/register` | Register | Create an account; sends you back to login. |

Protected routes (require `state.user.isLoggedIn`; otherwise redirect to `/`):

| Path | Page | Purpose |
|------|------|---------|
| `/home` | Home | Dashboard and calendar entry point. |
| `/form` | AddTaskPage | Standalone “add task” form and course admin block. |
| `/tasks` | TasksPage | Task list and modals. |
| `/exams` | ExamsPage | Exam list and modals. |
| `/projects` | ProjectsPage | Project list, progress control, modals. |
| `/other` | OtherPage | Other items by group, modals, status toggles. |
| `/api` | ResourcesPage | YouTube search + favorites (path name is historical; it is the learning hub UI, not API docs). |
| `/moodle-sync` | MoodleSync | Import mock Moodle items. |

Other route behavior:

- `/tests` redirects to `/exams`.
- `*` shows `NotFoundPage`.

## State management, hooks, and local storage

**Redux**

- **`userSlice`:** Holds `user` (name, email, id), `isLoggedIn`, `lastTaskAdded`, and a small `auth` object used during login loading. Login and logout also write or clear a JSON blob in `localStorage` under `studybuddy_auth`. When the logged-in user id changes, a couple of keys (`add-task-form`, `tasks-course-filter`) are cleared so drafts do not leak between accounts.

- **`dashboardSlice`:** Tracks `selectedCategory` when navigating from the home cards, `latestSyncAt` after Moodle sync, and `lastCreatedItem` so newly created entities can flash a short highlight before the flag is cleared.

**Custom hooks**

- **`useFetch(url)`** – If `url` is empty, it resets to idle. Otherwise it GETs the URL, exposes `data`, `loading`, `error`, and `refetch` (increments an internal counter to re-run the effect). Used across pages for tasks, exams, projects, courses, favorites, Moodle payload, etc.

- **`useLocalStorage(key, initial)`** – Keeps React state in sync with `JSON.stringify` / `JSON.parse` on a given key; used for theme and for things like the tasks course filter and the add-task draft form.

**localStorage summary**

- Auth snapshot (not the password), theme, task filter, and add-task draft keys as above. Parsing errors fall back to the initial value; write errors are logged to the console.

## API overview (server)

All routes below are under the Express app in `server/server.js`. The client typically uses `API_BASE_URL` from `VITE_API_BASE_URL` (see `src/config/api.js`).

**Health**

- `GET /api/health` – Simple `{ ok: true }` check.

**Auth**

- `POST /api/auth/register` – Creates a user; password is hashed with bcrypt.
- `POST /api/auth/login` – Validates credentials and returns user fields the client stores.

**Core study entities (CRUD-style)**

- **Tasks:** `GET/POST /api/tasks`, `PUT/DELETE /api/tasks/:id` (queries often include `userId` and sometimes `category`).
- **Exams:** `GET/POST /api/exams`, `PUT/DELETE /api/exams/:id`.
- **Projects:** `GET/POST /api/projects`, `PUT/DELETE /api/projects/:id`.
- **Other items:** `GET/POST /api/others`, `PUT/DELETE /api/others/:id`.

**Courses**

- `GET/POST /api/courses`, `PUT/DELETE /api/courses/:id` – Shared course list used across tasks, exams, projects, forms, and Moodle import helpers.

**Categories**

- `GET/POST /api/categories` – Implemented on the server for per-user category documents. The current React app does not call these routes; the “Other” page builds its filter list from item data already loaded from `/api/others`.

**Moodle mock data**

- `GET /api/moodle/sync` – Returns mock tasks, exams, and projects for the sync and resources pages (not a live Moodle connection).

**Favorites (videos)**

- `GET/POST /api/favorite-videos`, `PUT/DELETE /api/favorite-videos/:id` – Persists saved YouTube entries and notes per user.

**Curated blogs**

- `GET /api/resources/blogs` – Returns static blog suggestions from the server. The current client code does not fetch this endpoint (it is available if you extend the UI later).

The server validates with Mongoose where models enforce rules, and returns JSON error messages the client can surface in alerts.

## Environment variables

**Client – `.env` in the project root (copy from `.env.example`)**

- `VITE_API_BASE_URL` – Base URL of the API (for local work, `http://localhost:5050` matches a typical `PORT=5050` server).

- `VITE_YOUTUBE_API_KEY` – YouTube Data API key. The resources page reads this at runtime. If it is empty, the UI explains that live search will not work.

- `VITE_NEWS_API_KEY` – Listed in `.env.example` but nothing in the current `src/` tree reads it, so you can leave it blank unless you add your own feature later.

**Server – `server/.env` (copy from `server/.env.example`)**

- `MONGO_URI` – MongoDB connection string (required for the app to talk to the database).

- `PORT` – Port the API listens on (example in the repo uses `5050`; if you omit it, the code falls back to `5000`, so keep client and server ports aligned).

Optional server variables (only if you need them):

- `CORS_ORIGINS` – Comma-separated extra allowed browser origins for the deployed frontend.

- `MONGO_CONNECT_MAX_ATTEMPTS` and `MONGO_CONNECT_RETRY_DELAY_MS` – Control startup retry behavior if the database is slow to accept connections.

## How to run locally

1. **Clone or open the repo** and install dependencies from the root:

   ```bash
   npm install
   ```

   The root `package.json` runs `postinstall` so dependencies inside `server/` are installed as well. If anything looks wrong, you can still run `npm --prefix server install` manually.

2. **Create env files** (do not commit real secrets):

   - Copy `.env.example` to `.env` in the root and fill `VITE_API_BASE_URL` (and `VITE_YOUTUBE_API_KEY` if you want YouTube search).

   - Copy `server/.env.example` to `server/.env` and set a real `MONGO_URI`. Set `PORT` to the same port your client expects (for example `5050`).

3. **Start the API** (from the repo root, either of these is fine):

   ```bash
   npm run dev:server
   ```

   or

   ```bash
   cd server
   npm run dev
   ```

   `dev` uses nodemon; `npm start` / `node server.js` is the plain production-style start.

4. **Start the client** in a second terminal (from the repo root):

   ```bash
   npm run dev
   ```

   Vite prints a local URL (by default something like `http://localhost:5173`). Open that in the browser.

5. **Log in flow:** Register at `/register`, then log in at `/`. Protected routes redirect to `/` if you are not logged in.

## Database

Data lives in MongoDB. Each major entity type (users, tasks, exams, projects, other items, courses, favorite videos, etc.) has a Mongoose model under `server/models/`. If `MONGO_URI` is wrong or the cluster blocks your IP, the server logs connection failures and the client will show fetch errors on the pages that depend on the API.

## Notes for whoever grades or runs this

- The **protected route** check is entirely client-side (`isLoggedIn` in Redux). Refreshing the page keeps you “in” because auth is rehydrated from `localStorage`. It assumes the API still accepts requests for that user id; there is no separate step that re-validates the session with the server on every load.

- **CORS:** Localhost origins are allowed by default. For a hosted frontend, you may need `CORS_ORIGINS` (and the server file already whitelists specific known Vercel-style origins for this project—check `server/server.js` if you deploy somewhere new).

- **Route `/api`:** Despite the path, it is the **Learning Hub / resources UI**, not REST documentation.

- **YouTube:** Search runs in the browser using your key; without `VITE_YOUTUBE_API_KEY`, favorites and layout still load but search is limited to the messaging in the UI.

- **Port mismatch:** If the server falls back to port `5000` because `PORT` is unset, update `VITE_API_BASE_URL` to match or define `PORT` explicitly in `server/.env`.
