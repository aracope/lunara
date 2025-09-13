import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// ---- Mocks
// Mock AuthContext useAuth
let loginMock = vi.fn();
vi.mock("../../../context/AuthContext.jsx", () => ({
    __esModule: true,
    useAuth: () => ({ login: loginMock }),
}));

// Mock useNavigate from react-router-dom, but keep the rest of the module
const navigateMock = vi.fn();
vi.mock("react-router-dom", async (orig) => {
    const mod = await orig();
    return {
        ...mod,
        useNavigate: () => navigateMock,
    };
});

// Under test
import LoginForm from "../LoginForm.jsx";

function setup() {
    render(
        <MemoryRouter initialEntries={["/login"]}>
            <LoginForm />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("LoginForm", () => {
    test("shows validation errors when submitting empty form", async () => {
        setup();

        fireEvent.click(screen.getByRole("button", { name: /login/i }));

        // Yup validation messages should appear
        expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
        expect(await screen.findByText(/password is required/i)).toBeInTheDocument();

        expect(loginMock).not.toHaveBeenCalled();
        expect(navigateMock).not.toHaveBeenCalled();
    });

    test("calls login and navigates to /dashboard on success", async () => {
        loginMock.mockResolvedValueOnce({ ok: true });
        setup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /login/i }));

        await waitFor(() => {
            expect(loginMock).toHaveBeenCalledWith("ara@example.com", "passpass123");
            expect(navigateMock).toHaveBeenCalledWith("/dashboard", {
                state: { flash: "Welcome back, ara@example.com!" },
            });
        });
    });

    test("shows status message when login fails", async () => {
        loginMock.mockRejectedValueOnce(new Error("Invalid credentials"));
        setup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /login/i }));

        // Status region should show the error; should NOT navigate
        const status = await screen.findByRole("status");
        expect(status).toHaveTextContent(/invalid credentials/i);
        expect(navigateMock).not.toHaveBeenCalled();
    });
});
