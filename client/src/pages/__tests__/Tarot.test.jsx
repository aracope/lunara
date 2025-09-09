import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, within, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock API used by Tarot
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: {
        tarotList: vi.fn(),
        tarotDaily: vi.fn(),
        tarotYesNo: vi.fn(),
        tarotCard: vi.fn(),
    },
}));
import { api } from "../../lib/apiClient.js";

// Under test
import Tarot from "../Tarot.jsx";

function renderTarot() {
    return render(
        <MemoryRouter>
            <Tarot />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Tarot page", () => {
    test("loads the deck list for the select (major + a suit)", async () => {
        api.tarotList.mockResolvedValueOnce([
            { id: 0, name: "The Fool", arcana: "Major" },
            { id: 1, name: "Ace of Cups", arcana: "Minor", suit: "Cups" },
        ]);

        renderTarot();

        // Wait for select to be hydrated
        const select = await screen.findByRole("combobox", { name: /choose a card/i });
        // Options should include our items
        expect(screen.getByRole("option", { name: /the fool/i })).toBeInTheDocument();
        expect(screen.getByRole("option", { name: /ace of cups/i })).toBeInTheDocument();
        // Default disabled prompt option remains selected
        expect(select).toHaveValue("");
    });

    test("draws 'Card of the day' and shows panel", async () => {
        api.tarotList.mockResolvedValueOnce([]); // initial list not relevant here
        api.tarotDaily.mockResolvedValueOnce({
            card: {
                name: "The Sun",
                arcana: "Major",
                upright_meaning: "Joy, success",
                reversed_meaning: "Temporary setbacks",
            },
        });

        renderTarot();

        fireEvent.click(screen.getByRole("button", { name: /card of the day/i }));

        await waitFor(() => {
            expect(screen.getByRole("heading", { name: /card of the day/i })).toBeInTheDocument();
            expect(screen.getByText(/the sun/i)).toBeInTheDocument();
            expect(screen.getByText(/joy, success/i)).toBeInTheDocument();
        });
    });

    test("submits yes/no question and shows badge + optional drawn card", async () => {
        api.tarotList.mockResolvedValueOnce([]); // not used
        api.tarotYesNo.mockResolvedValueOnce({
            answer: "yes",
            reason: "Favorable energies",
            card: { name: "Two of Cups", arcana: "Minor", suit: "Cups" },
        });

        renderTarot();

        // Fill question and submit
        fireEvent.change(screen.getByPlaceholderText(/ask a yes\/no question/i), {
            target: { value: "Will I ace the interview?" },
        });
        fireEvent.click(screen.getByRole("button", { name: /yes \/ no/i }));

        await waitFor(() => {
            // Panel heading
            expect(screen.getByRole("heading", { name: /yes \/ no/i })).toBeInTheDocument();
            // Badge label
            expect(screen.getByText(/^yes$/i)).toBeInTheDocument();
            // Reason appears
            expect(screen.getByText(/favorable energies/i)).toBeInTheDocument();
            // Drawn card section
            expect(screen.getByRole("heading", { name: /drawn card/i })).toBeInTheDocument();
            expect(screen.getByText(/two of cups/i)).toBeInTheDocument();
        });
    });

    test("fetches specific card by id from the select", async () => {
        api.tarotList.mockResolvedValueOnce([
            { id: 42, name: "Ace of Wands", arcana: "Minor", suit: "Wands" },
        ]);
        api.tarotCard.mockResolvedValueOnce({
            name: "Ace of Wands",
            arcana: "Minor",
            suit: "Wands",
            upright_meaning: "Inspiration",
            reversed_meaning: "Delays",
        });

        renderTarot();

        const select = await screen.findByRole("combobox", { name: /choose a card/i });
        // Choose the Ace of Wands (id 42)
        fireEvent.change(select, { target: { value: "42" } });

        // Submit the "Get card" form
        fireEvent.click(screen.getByRole("button", { name: /get card/i }));

        await waitFor(() => {
            expect(api.tarotCard).toHaveBeenCalledWith(42);

            // Scope to the "Card details" article so we don't match the <option>
            const panel = screen.getByRole("heading", { name: /card details/i }).closest("article");
            const utils = within(panel);

            expect(utils.getByRole("heading", { name: /^ace of wands$/i })).toBeInTheDocument();
            expect(utils.getByText(/inspiration/i)).toBeInTheDocument();
        });
    });
});
