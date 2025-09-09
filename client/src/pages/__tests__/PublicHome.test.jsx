import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import PublicHome from "../PublicHome.jsx";

// Mock AuthContext
vi.mock("../../context/AuthContext.jsx", () => ({
    __esModule: true,
    useAuth: () => ({ user: mockUser }),
}));

let mockUser = null;

function renderHome() {
    return render(
        <MemoryRouter initialEntries={["/"]}>
            <PublicHome />
        </MemoryRouter>
    );
}

describe("PublicHome", () => {
    test("renders hero and CTAs when no user", () => {
        mockUser = null;
        renderHome();

        expect(screen.getByRole("heading", { name: /lunara/i })).toBeInTheDocument();
        expect(
            screen.getByText(/moon phases, tarot draws/i)
        ).toBeInTheDocument();

        // Links
        expect(screen.getByRole("link", { name: /create account/i })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();

        // Feature cards
        expect(screen.getByRole("heading", { name: /moon/i })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /tarot/i })).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: /journal/i })).toBeInTheDocument();
    });

    test("redirects to dashboard when user exists", () => {
        mockUser = { id: 1, email: "ara@example.com" };
        renderHome();

        // Instead of text, Navigate replaces with nothing in DOM.
        // So we just assert the hero content is not shown.
        expect(screen.queryByText(/moon phases/i)).not.toBeInTheDocument();
    });
});
