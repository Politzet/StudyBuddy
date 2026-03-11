# StudyBuddy

React + Vite study task management app for coursework assignments.

## Custom Hooks

- Files:
  - `src/hooks/useLocalStorage.js`
  - `src/hooks/useFetch.js`
- `useLocalStorage(key, initialValue)`:
  - Reads an initial value from `localStorage`.
  - Writes updates automatically whenever state changes.
  - Used for theme persistence and form draft persistence.
- `useFetch(url)`:
  - Encapsulates API logic with `data`, `loading`, `error`, and `refetch`.
  - Used in:
    - `src/pages/ResourcesPage.jsx`
    - `src/pages/HomePage.jsx` (Quick Resources section)
  - Keeps fetch logic out of components.

## Redux User Slice

`src/store/userSlice.js` contains global user state with:

- Fields:
  - `user` (object or `null`)
  - `isLoggedIn` (boolean)
  - `lastTaskAdded` (string)
- Actions:
  - `login` (set user data and mark logged in)
  - `logout` (clear user data)
  - `updateUsername` (update only the user name)
  - `setLastTaskAdded` (update last added task title)

## Main Pages

- `src/pages/HomePage.jsx`
- `src/pages/AddTaskPage.jsx`
- `src/pages/ResourcesPage.jsx`

## State Ownership

- Theme (`light` / `dark`) is persisted with `useLocalStorage` in `ThemeContext`.
- User/auth/task metadata is managed globally with Redux Toolkit.