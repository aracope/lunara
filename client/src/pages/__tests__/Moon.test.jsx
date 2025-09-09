import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// Mock API
vi.mock("../../lib/apiClient.js", () => ({
    __esModule: true,
    api: {
        moonToday: vi.fn(),
    },
}));
import { api } from "../../lib/apiClient.js";

// Mock MoonResult so we only check data flow
vi.mock("../../components/MoonResult.jsx", () => ({
    __esModule: true,
    default: ({ data }) => <div data-testid="moon-result">{JSON.stringify(data)}</div>,
}));

import Moon from "../Moon.jsx";

function renderMoon() {
    return render(
        <MemoryRouter>
            <Moon />
        </MemoryRouter>
    );
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("Moon page", () => {
    test("renders brand heading and default place input", () => {
        renderMoon();
        expect(screen.getByRole("heading", { name: /moon/i })).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/boise/i)).toBeInTheDocument();
    });

    test("fetches by place on submit", async () => {
        api.moonToday.mockResolvedValueOnce({ phase: "Full Moon" });
        renderMoon();

        fireEvent.click(screen.getByRole("button", { name: /fetch/i }));

        await waitFor(() => {
            expect(api.moonToday).toHaveBeenCalledWith({ location: "Boise, ID" });
            expect(screen.getByTestId("moon-result")).toHaveTextContent("Full Moon");
        });
    });

    test("switching to coords mode shows lat/lon inputs", () => {
        renderMoon();

        fireEvent.click(screen.getByRole("radio", { name: /coordinates/i }));
        expect(screen.getByPlaceholderText(/latitude/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/longitude/i)).toBeInTheDocument();
    });

    test("handles API error gracefully", async () => {
        api.moonToday.mockRejectedValueOnce(new Error("API down"));
        renderMoon();

        fireEvent.click(screen.getByRole("button", { name: /fetch/i }));

        await waitFor(() => {
            expect(screen.getByRole("status")).toHaveTextContent(/api down/i);
        });
    });
});
