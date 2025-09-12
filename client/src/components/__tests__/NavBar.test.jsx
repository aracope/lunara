// src/components/__tests__/NavBar.test.jsx
import React from "react";
import { describe, test, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NavBar from "../NavBar.jsx";

// Mock AuthContext
let authState = { user: null, logout: vi.fn() };
vi.mock("../../context/AuthContext.jsx", () => ({
  __esModule: true,
  useAuth: () => authState,
}));

function renderNav(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <NavBar />
    </MemoryRouter>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("NavBar", () => {
  test("renders brand only when not authenticated", () => {
    authState = { user: null, logout: vi.fn() };
    renderNav();

    // Brand is visible
    expect(screen.getByRole("link", { name: /lunara/i })).toBeInTheDocument();

    // No logout button or user label when logged out
    expect(screen.queryByRole("button", { name: /logout/i })).not.toBeInTheDocument();
    expect(screen.queryByText("Ara")).not.toBeInTheDocument();
    expect(screen.queryByText(/@/i)).not.toBeInTheDocument();
  });

  test("shows user name and Logout when authenticated", () => {
    authState = { user: { email: "a@x.com", display_name: "Ara" }, logout: vi.fn() };
    renderNav();

    // Brand still visible
    expect(screen.getByRole("link", { name: /lunara/i })).toBeInTheDocument();

    // Shows user's display name (or email fallback)
    expect(screen.getByText("Ara")).toBeInTheDocument();

    // Logout button present
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });

  test("calls logout when Logout button is clicked", () => {
    const mockLogout = vi.fn();
    authState = { user: { email: "a@x.com" }, logout: mockLogout };
    renderNav();

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
