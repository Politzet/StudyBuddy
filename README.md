# StudyBuddy

## What is this?

StudyBuddy is a full-stack web app I built to keep school work in one place instead of scattered notes and separate tools. After you register and log in, you can track tasks, exams, projects, and miscellaneous items, browse a dashboard that pulls it all together, manage courses, import mock “Moodle” assignments into the app, and use a Learning Hub that searches YouTube by course and assignment and saves favorites with notes.

The idea is straightforward: one login, real data in a database, and separate screens for each kind of item so the UI stays tidy and pleasant to use.

## Try it live

My deployment is online:

- **The site (client):** [study-buddy-wizard.vercel.app](https://study-buddy-wizard.vercel.app)  
  This is the React app in the browser — sign in, explore the UI, and use the app.

- **The server (API):** [studybuddy-rcc6.onrender.com](https://studybuddy-rcc6.onrender.com)  
  This is the Express API talking to MongoDB. You can check it is up with `GET /api/health` (for example `https://studybuddy-rcc6.onrender.com/api/health`). The Vercel deployment is configured to use this URL as the API base.

If you run the project locally from source, set `VITE_API_BASE_URL` to `http://localhost:5050` (or whatever port your server uses) so the browser talks to your machine instead of Render.

## What the app does

**Account:** Register with email, username, and password; log in with email and password. The client stores a small user payload in `localStorage` so a refresh does not log you out until you sign out (there is no separate “token” screen — it behaves like a session on top of stored info).

**Home:** An overview of tasks, exams, projects, and “other” items, with course filtering, counts, and highlights such as upcoming exams and tasks due soon. There is also a calendar modal to browse by day.

**Tasks:** A list with course filter, add/edit in a modal, delete, status controls (not started / in progress / done, and so on), and optional “study days” validation against the due date. Tasks are tied to the logged-in user on the API side.

**Exams and projects:** Full CRUD — dates, locations, deadlines, and project progress with a slider that persists on the server.

**Other:** Items grouped by a category name (default “Other”), with an optional deadline and open/done status.

**Add-task form:** At `/form` there is a longer form for adding a task plus inline course management (some labels in that section are in Hebrew).

**Learning Hub (at `/api` — the path name is historical; it is not REST API docs):** Builds search queries, calls YouTube from the browser when an API key is set, and saves favorites with personal notes on the server.

**Moodle sync (demo):** The server returns mock tasks and exams; you can import them one by one into your real collections.

**Theme:** Light/dark preference is stored in `localStorage` via React context.

**Missing pages:** A simple 404 screen.

## How it is built (short)

**Client:** React with Vite, React Router, Redux Toolkit for global state (user and a small dashboard slice), Tailwind, Framer Motion, and `react-calendar` where needed.

**Server:** Node with Express, Mongoose for MongoDB, bcrypt for password hashing, CORS (including localhost and optional extra origins from env), and dotenv for `server/.env`.

**Folders:** Route-level screens live under `src/pages/`; shared pieces under `src/components/`; hooks such as `useFetch` (loading, error, refetch) and `useLocalStorage` under `src/hooks/`; Redux under `src/store/`; API base URL comes from `VITE_API_BASE_URL` in `src/config/api.js`. The server is mostly in `server/server.js` with Mongoose models under `server/models/`.

**Routes:** Public (no login): `/` for sign-in, `/register` for sign-up. After login: `/home` for the dashboard, `/tasks`, `/exams`, `/projects`, `/other`, `/form` for the add-task form, `/api` for the Learning Hub, `/moodle-sync` for Moodle import. `/tests` redirects to `/exams`. Anything else hits the 404 page.

## Environment variables

Copy `.env.example` to `.env` in the project root:

- **`VITE_API_BASE_URL`** — Base URL for the API. Locally: `http://localhost:5050` (matches a server on port 5050). In production, the Vercel client points at the API on Render ([studybuddy-rcc6.onrender.com](https://studybuddy-rcc6.onrender.com)).
- **`VITE_YOUTUBE_API_KEY`** — YouTube Data API key for the Learning Hub. If it is empty, the UI explains that live search is not available.
- **`VITE_NEWS_API_KEY`** — Listed in the example file but the current app does not use it; you can leave it blank.

For the server, copy `server/.env.example` to `server/.env`:

- **`MONGO_URI`** — MongoDB connection string (required for the app to talk to the database).
- **`PORT`** — Port the API listens on (the code defaults to `5050` to avoid macOS binding port `5000` for AirPlay). When running locally, `VITE_API_BASE_URL` on the client should match that port.

Optional on the server: **`CORS_ORIGINS`** (comma-separated extra browser origins), and **`MONGO_CONNECT_MAX_ATTEMPTS`** / **`MONGO_CONNECT_RETRY_DELAY_MS`** if you want to tune MongoDB connection retries.

## How to run it on your machine

Install dependencies from the root (there is a `postinstall` that also installs `server/`; if something fails, run `npm --prefix server install` manually):

```bash
npm install
```

Create the `.env` files as described above — do not commit real secrets to git.

In one terminal, start the API:

```bash
npm run dev:server
```

Or `cd server` and `npm run dev` (nodemon). For a plain run without nodemon: `npm start` or `node server.js`.

In a second terminal, from the root, start the client:

```bash
npm run dev
```

Vite will print a local URL (often something like `http://localhost:5173`). Open it in the browser, register at `/register`, then sign in at `/`. Protected screens redirect to `/` if you are not logged in.

## Database

Data lives in MongoDB. Each main entity (users, tasks, exams, projects, courses, favorites, and so on) has a Mongoose model under `server/models/`. If `MONGO_URI` is wrong or the cluster blocks your IP, the server logs connection errors and the browser shows fetch errors on pages that depend on the API.

## Notes for reviewers

Route protection for “logged-in only” screens is client-side (`isLoggedIn` in Redux). Refresh keeps you signed in because auth is rehydrated from `localStorage`. There is no separate server round-trip on every page load to “re-validate” a session — it assumes the API still accepts requests for the stored user id.

CORS allows localhost by default; for a new deployed domain you may need to add an origin in `CORS_ORIGINS` or update the list in `server/server.js`.

The `/api` route in the UI is the **Learning Hub / resources screen**, not API documentation.

YouTube search runs in the browser with your key; without `VITE_YOUTUBE_API_KEY` you can still see favorites and layout, but live search is limited to what the UI explains.

If the server port and client do not match, update `VITE_API_BASE_URL` to the URL the server prints when it starts, or set `PORT` in `server/.env` (the code defaults to `5050`).

