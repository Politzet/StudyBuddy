# StudyBuddy

StudyBuddy is a React + Vite web app for managing study tasks and browsing study resources.

## Project Structure

- `src/components` - reusable UI components
- `src/pages` - route-level pages
- `src/hooks` - custom hooks
- `src/store` - Redux store and slices
- `server` - Express API and MongoDB integration

## Main Pages

- `src/pages/HomePage.jsx`
- `src/pages/AddTaskPage.jsx`
- `src/pages/ResourcesPage.jsx`

## Custom Hooks

- `src/hooks/useLocalStorage.js`
  - Persists local state to `localStorage`
  - Used for theme preference and form draft
- `src/hooks/useFetch.js`
  - Handles `data`, `loading`, `error`, `refetch`
  - Used by resources views and task fetching

## Redux Slice

- `src/store/userSlice.js`
- Fields:
  - `user`
  - `isLoggedIn`
  - `lastTaskAdded`
- Actions:
  - `login`
  - `logout`
  - `updateUsername`
  - `setLastTaskAdded`

## Server API

Base URL: `http://localhost:5050`

- `GET /api/health`
- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

## Environment Variables

### Client (`.env`)

Copy from `.env.example`:

- `VITE_API_BASE_URL` (example: `http://localhost:5050`)
- `VITE_NEWS_API_KEY` (optional for live news)

### Server (`server/.env`)

Copy from `server/.env.example`:

- `MONGO_URI` (MongoDB Atlas connection string)
- `PORT` (example: `5050`)

## How to Run

### 1) Install dependencies

From project root:

```bash
npm install
npm --prefix server install
```

### 2) Set up environment files

Copy both examples:

```bash
cp .env.example .env
cp server/.env.example server/.env
```

Update `server/.env` with your real Atlas `MONGO_URI`.

### 3) Run server

```bash
cd server
npm install
npm start
```

### 4) Run client

In another terminal (project root):

```bash
npm install
npm run dev
```

Client: `http://localhost:5173`  
Server: `http://localhost:5050`