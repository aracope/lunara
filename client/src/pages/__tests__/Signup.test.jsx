import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock api
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: { signup: vi.fn() },
}));
import { api } from "../../lib/apiClient.js";

// --- Spy on navigation ---
const navigateMock = vi.fn();

// Mock react-router's useNavigate but keep everything else real
vi.mock("react-router-dom", async () => {
    const actual = await vi.importActual("react-router-dom");
    return {
        __esModule: true,
        ...actual,
        useNavigate: () => navigateMock,
    };
});

// --- Mock AuthContext so <SignupForm/> can call useAuth() without a real provider ---
vi.mock("../../context/AuthContext.jsx", async () => {
    const actual = await vi.importActual("../../context/AuthContext.jsx");
    return {
        __esModule: true,
        ...actual,
        // Pass-through provider so tree renders normally
        AuthProvider: ({ children }) => <>{children}</>,
        // useAuth returns a minimal surface used by SignupForm
        useAuth: () => ({
            signup: (email, password, displayName) =>
                api.signup(email, password, displayName),
        }),
    };
});

import Signup from "../Signup.jsx";

function renderSignup() {
    return render(
        <MemoryRouter initialEntries={["/signup"]}>
            <Signup />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Signup page", () => {
    test("submits form and shows success message", async () => {
        api.signup.mockResolvedValueOnce({ user: { email: "ara@example.com" } });

        renderSignup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/display name/i), {
            target: { value: "Ara" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(
            screen.getByRole("button", { name: /create account/i })
        );

        await waitFor(() => {
            expect(api.signup).toHaveBeenCalledWith(
                "ara@example.com",
                "passpass123",
                "Ara"
            );
            expect(navigateMock).toHaveBeenCalledWith(
                "/dashboard",
                expect.objectContaining({
                    state: expect.objectContaining({
                        flash: expect.stringMatching(/ara@example\.com/i),
                    }),
                })
            );
        });
    });

    test("shows error message on failure and does not navigate", async () => {
        api.signup.mockRejectedValueOnce(new Error("Email already exists"));

        renderSignup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
            expect(navigateMock).not.toHaveBeenCalled();
        });
    });
});
