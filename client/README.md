README — Client-side Auth Flow
## Auth flow overview

- AuthContext exposes { user, authLoaded, login, logout }.

    - authLoaded prevents premature redirects while the app is restoring a session (e.g., checking a cookie/JWT).

    - user is null when logged out and an object when authenticated.

- ProtectedRoute (client/src/components/ProtectedRoute.jsx)

    - Shows a loading state until authLoaded is true.

    - If there’s no user, redirects to /login and preserves the originally requested route via location in state.from.

    - If user exists, renders the nested route (<Outlet />).

## NavBar Component Tests

- The NavBar component is tested with Vitest + React Testing Library to confirm its core behavior:

    - Guest state – shows public links (Moon, Tarot, Login, Sign Up) and hides authenticated-only links.

    - Authenticated state – shows private links (Dashboard, Journal), the user’s display name or email, and a Logout button.

    - Logout action – clicking the button calls the logout function from AuthContext.

These tests verify the main conditional rendering logic and user actions.
Highlight styling (active class on NavLink) is not tested, since it’s a visual detail and not critical for submission.