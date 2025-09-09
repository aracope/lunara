import React from "react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignupForm from "../SignupForm.jsx";


// ---- Mock AuthContext useAuth
let signupMock = vi.fn();
vi.mock("../../../context/AuthContext.jsx", () => ({
    __esModule: true,
    useAuth: () => ({ signup: signupMock }),
}));


function setup() {
    render(<SignupForm />);
}

beforeEach(() => {
    vi.clearAllMocks();
});

describe("SignupForm", () => {
    test("shows validation errors on empty submit", async () => {
        setup();

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        // We expect at least the email + password "Required" errors
        const requireds = await screen.findAllByText(/required/i);
        expect(requireds.length).toBeGreaterThanOrEqual(2);

        expect(signupMock).not.toHaveBeenCalled();
    });

    test("calls signup with trimmed displayName", async () => {
        signupMock.mockResolvedValueOnce({ ok: true });
        setup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/display name/i), {
            target: { value: "  Ara  " },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(signupMock).toHaveBeenCalledWith(
                "ara@example.com",
                "passpass123",
                "Ara"
            );
        });
    });

    test("passes undefined for empty displayName", async () => {
        signupMock.mockResolvedValueOnce({ ok: true });
        setup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        await waitFor(() => {
            expect(signupMock).toHaveBeenCalledWith(
                "ara@example.com",
                "passpass123",
                undefined
            );
        });
    });

    test("shows status message when signup fails", async () => {
        signupMock.mockRejectedValueOnce(new Error("Email already in use"));
        setup();

        fireEvent.change(screen.getByLabelText(/email/i), {
            target: { value: "ara@example.com" },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
            target: { value: "passpass123" },
        });

        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        const status = await screen.findByRole("status");
        expect(status).toHaveTextContent(/email already in use/i);
    });

    test("validates displayName length", async () => {
        setup();

        fireEvent.change(screen.getByLabelText(/display name/i), {
            target: { value: "x".repeat(61) },
        });
        fireEvent.click(screen.getByRole("button", { name: /create account/i }));

        expect(await screen.findByText(/max 60 chars/i)).toBeInTheDocument();
        expect(signupMock).not.toHaveBeenCalled();
    });
});
