import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the LoginForm used by the page
vi.mock("../../components/auth/LoginForm.jsx", () => ({
    __esModule: true,
    default: () => <div data-testid="login-form">[LoginForm]</div>,
}));

import Login from "../Login.jsx";

function renderLogin() {
    return render(
        <MemoryRouter initialEntries={["/login"]}>
            <Login />
        </MemoryRouter>
    );
}

describe("Login page", () => {
    test("renders brand copy and the login form", () => {
        renderLogin();

        // Brand side
        expect(screen.getByRole("heading", { name: /lunara/i })).toBeInTheDocument();
        expect(
            screen.getByText(/sign in to your book of shadows/i)
        ).toBeInTheDocument();

        // Form side
        expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
        expect(
            screen.getByText(/log in to continue your practice/i)
        ).toBeInTheDocument();

        // Mocked LoginForm is present
        expect(screen.getByTestId("login-form")).toBeInTheDocument();

        // Link to signup exists
        expect(screen.getByRole("link", { name: /create an account/i })).toBeInTheDocument();
    });
});
