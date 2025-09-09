import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock the API used by Dashboard
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: {
        me: vi.fn(),
        listJournal: vi.fn(),
    },
}));
import { api } from "../../lib/apiClient.js";

// Under test
import Dashboard from "../Dashboard.jsx";

function renderDash() {
    return render(
        <MemoryRouter initialEntries={["/dashboard"]}>
            <Dashboard />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Dashboard", () => {
    test("shows loading until data resolves", async () => {
        api.me.mockResolvedValueOnce({ user: { email: "ara@example.com" } });
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        renderDash();

        // Loading visible first
        expect(screen.getByText(/loading…/i)).toBeInTheDocument();

        // Gone after fetch completes
        await waitFor(() => {
            expect(screen.queryByText(/loading…/i)).not.toBeInTheDocument();
        });
    });

    test("renders personalized welcome and account info", async () => {
        api.me.mockResolvedValueOnce({
            user: { email: "ara@example.com", display_name: "Ara", created_at: "2025-08-01T00:00:00Z" },
        });
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        renderDash();

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /welcome, ara/i })).toBeInTheDocument();
        });

        // Account card basics
        expect(
            screen.getByRole("heading", { name: /^account$/i })
        ).toBeInTheDocument();
        expect(screen.getByText("Ara")).toBeInTheDocument();
        expect(screen.getByText("ara@example.com")).toBeInTheDocument();
    });

    test("renders empty state when no entries", async () => {
        api.me.mockResolvedValueOnce({ user: { email: "ara@example.com" } });
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        renderDash();

        await waitFor(() => {
            expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
        });
    });

    test("shows at most three recent entries with title + snippet", async () => {
        api.me.mockResolvedValueOnce({ user: { email: "ara@example.com" } });
        const mk = (i) => ({
            id: i,
            title: `Entry ${i}`,
            body: "x".repeat(160),
            created_at: `2025-08-${10 + i}T12:00:00Z`,
        });
        api.listJournal.mockResolvedValueOnce({
            entries: [mk(1), mk(2), mk(3), mk(4)], // 4 total; should show only 3
        });

        renderDash();

        // Three items shown
        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /recent entries/i })).toBeInTheDocument();
            expect(screen.getByText("Entry 1")).toBeInTheDocument();
            expect(screen.getByText("Entry 2")).toBeInTheDocument();
            expect(screen.getByText("Entry 3")).toBeInTheDocument();
        });
        // The 4th should not be rendered
        expect(screen.queryByText("Entry 4")).not.toBeInTheDocument();

        // Snippet ends with ellipsis when > 140 chars
        expect(screen.getAllByText(/…$/).length).toBeGreaterThanOrEqual(1);
    });

    test("is resilient to API errors (falls back gracefully)", async () => {
        api.me.mockRejectedValueOnce(new Error("boom"));
        api.listJournal.mockRejectedValueOnce(new Error("boom2"));

        renderDash();

        await waitFor(() => {
            // Still renders skeleton layout without crashing
            expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
        });
        expect(screen.getByText(/no entries yet/i)).toBeInTheDocument();
    });
});
