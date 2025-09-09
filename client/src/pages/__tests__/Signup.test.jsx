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

// Under test
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

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText(/display name/i), {
            target: { value: "Ara" },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(api.signup).toHaveBeenCalledWith("ara@example.com", "passpass123", "Ara");
            expect(screen.getByText(/registered as ara@example.com/i)).toBeInTheDocument();
        });
    });

    test("shows error message on failure", async () => {
        api.signup.mockRejectedValueOnce(new Error("Email already exists"));

        renderSignup();

        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByPlaceholderText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
        });
    });
});