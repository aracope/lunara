README — Client-side Auth Flow
## Auth flow overview

- AuthContext exposes { user, authLoaded, login, logout }.

    - authLoaded prevents premature redirects while the app is restoring a session (e.g., checking a cookie/JWT).

    - user is null when logged out and an object when authenticated.

- ProtectedRoute (client/src/components/ProtectedRoute.jsx)

    - Shows a loading state until authLoaded is true.

    - If there’s no user, redirects to /login and preserves the originally requested route via location in state.from.

    - If user exists, renders the nested route (<Outlet />).
