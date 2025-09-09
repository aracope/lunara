import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "../AuthContext.jsx";

// --- Mock apiClient
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: {
        me: vi.fn(),
        login: vi.fn(),
        signup: vi.fn(),
        logout: vi.fn(),
    },
}));
import { api } from "../../lib/apiClient.js";

// Test helper: a component that uses the context
function ShowUser() {
    const { user, authLoaded } = useAuth();
    return (
        <div>
            <div data-testid="authLoaded">{String(authLoaded)}</div>
            <div data-testid="user">{user ? user.email : "none"}</div>
        </div>
    );
}

function renderWithProvider(ui) {
    return render(<AuthProvider>{ui}</AuthProvider>);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("AuthContext", () => {
    test("hydrates user on mount via api.me", async () => {
        api.me.mockResolvedValueOnce({ user: { email: "ara@example.com" } });

        renderWithProvider(<ShowUser />);

        // Initially false/none
        expect(screen.getByTestId("authLoaded")).toHaveTextContent("false");
        expect(screen.getByTestId("user")).toHaveTextContent("none");

        // After hydration
        await waitFor(() => {
            expect(screen.getByTestId("authLoaded")).toHaveTextContent("true");
            expect(screen.getByTestId("user")).toHaveTextContent("ara@example.com");
        });
    });

    test("login sets user", async () => {
        // First api.me for hydration -> no user
        api.me
            .mockResolvedValueOnce({ user: null }) // hydration
            .mockResolvedValueOnce({ user: { email: "ara@example.com" } }); // after login

        api.login.mockResolvedValueOnce({});

        function LoginButton() {
            const { login } = useAuth();
            return <button onClick={() => login("ara@example.com", "pw")}>Login</button>;
        }

        renderWithProvider(
            <>
                <ShowUser />
                <LoginButton />
            </>
        );

        // Click login
        screen.getByText("Login").click();

        // User should update after the second api.me()
        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("ara@example.com");
        });
    });

    test("signup sets user", async () => {
        api.signup.mockResolvedValueOnce({ user: { email: "new@example.com" } });

        function SignupButton() {
            const { signup } = useAuth();
            return <button onClick={() => signup("new@example.com", "pw", "Ara")}>Signup</button>;
        }

        renderWithProvider(
            <>
                <ShowUser />
                <SignupButton />
            </>
        );

        screen.getByText("Signup").click();

        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("new@example.com");
        });
    });

    test("logout clears user", async () => {
        api.me.mockResolvedValueOnce({ user: { email: "ara@example.com" } });
        api.logout.mockResolvedValueOnce({});

        function LogoutButton() {
            const { logout } = useAuth();
            return <button onClick={logout}>Logout</button>;
        }

        renderWithProvider(
            <>
                <ShowUser />
                <LogoutButton />
            </>
        );

        // Hydrate user
        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("ara@example.com");
        });

        screen.getByText("Logout").click();

        await waitFor(() => {
            expect(screen.getByTestId("user")).toHaveTextContent("none");
        });
    });

    test("useAuth throws if used outside provider", () => {
        function BadComponent() {
            useAuth();
            return null;
        }
        expect(() => render(<BadComponent />)).toThrow(
            /useAuth must be used inside <AuthProvider>/
        );
    });
});
