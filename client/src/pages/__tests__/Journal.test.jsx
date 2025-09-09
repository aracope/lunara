import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock API
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: {
        listJournal: vi.fn(),
        createJournal: vi.fn(),
    },
}));
import { api } from "../../lib/apiClient.js";

// Mock JournalMoon (to avoid deeper dependencies)
vi.mock("../../components/JournalMoon.jsx", () => ({
    __esModule: true,
    default: ({ refData }) => <div data-testid="journal-moon">{JSON.stringify(refData)}</div>,
}));

// Under test
import Journal from "../Journal.jsx";

function renderJournal() {
    return render(
        <MemoryRouter>
            <Journal />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Journal", () => {
    test("renders entries after mount", async () => {
        api.listJournal.mockResolvedValueOnce({
            entries: [{ id: 1, title: "T1", body: "B1" }],
        });

        renderJournal();

        expect(await screen.findByText(/t1/i)).toBeInTheDocument();
        expect(screen.getByText(/b1/i)).toBeInTheDocument();
    });

    test("adds an entry and refreshes list", async () => {
        // Initial empty list
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        // After add, return one entry
        api.createJournal.mockResolvedValueOnce({});
        api.listJournal.mockResolvedValueOnce({
            entries: [{ id: 2, title: "New Title", body: "New Body" }],
        });

        renderJournal();

        // Fill form
        fireEvent.change(screen.getByPlaceholderText(/title/i), {
            target: { value: "New Title" },
        });
        fireEvent.change(screen.getByPlaceholderText(/body/i), {
            target: { value: "New Body" },
        });

        // Submit
        fireEvent.click(screen.getByRole("button", { name: /add/i }));

        await waitFor(() => {
            expect(api.createJournal).toHaveBeenCalled();
            expect(screen.getByText("New Title")).toBeInTheDocument();
            expect(screen.getByText(/new body/i)).toBeInTheDocument();
        });
    });

    test("attaches moonRef when checkbox is checked", async () => {
        api.listJournal.mockResolvedValueOnce({ entries: [] });
        api.createJournal.mockResolvedValueOnce({});
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        renderJournal();

        // Submit with attachMoon = true (default)
        fireEvent.click(screen.getByRole("button", { name: /add/i }));

        await waitFor(() => {
            expect(api.createJournal).toHaveBeenCalledWith(
                expect.objectContaining({
                    moonRef: expect.objectContaining({
                        date_ymd: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
                        tz: expect.any(String),
                    }),
                })
            );
        });
    });

    test("does not attach moonRef when checkbox is unchecked", async () => {
        api.listJournal.mockResolvedValueOnce({ entries: [] });
        api.createJournal.mockResolvedValueOnce({});
        api.listJournal.mockResolvedValueOnce({ entries: [] });

        renderJournal();

        fireEvent.click(screen.getByRole("checkbox", { name: /attach/i }));

        fireEvent.click(screen.getByRole("button", { name: /add/i }));

        await waitFor(() => {
            expect(api.createJournal).toHaveBeenCalledWith(
                expect.not.objectContaining({ moonRef: expect.anything() })
            );
        });
    });
});
