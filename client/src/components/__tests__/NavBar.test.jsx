import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// mock AuthContext
let authState = { user: null, logout: vi.fn() };
vi.mock("../../context/AuthContext.jsx", () => ({
  __esModule: true,
  useAuth: () => authState,
}));

import NavBar from "../NavBar.jsx";

function renderNav(initialRoute = "/") {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <NavBar />
    </MemoryRouter>
  );
}

describe("NavBar", () => {
  test("shows guest links when not authenticated", () => {
    authState = { user: null, logout: vi.fn() };
    renderNav();

    expect(screen.getByText(/moon/i)).toBeInTheDocument();
    expect(screen.getByText(/tarot/i)).toBeInTheDocument();
    expect(screen.getByText(/login/i)).toBeInTheDocument();
    expect(screen.getByText(/sign up/i)).toBeInTheDocument();
    expect(screen.queryByText(/dashboard/i)).not.toBeInTheDocument();
  });

  test("shows user links when authenticated", () => {
    authState = { user: { email: "a@x.com", display_name: "Ara" }, logout: vi.fn() };
    renderNav();

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/journal/i)).toBeInTheDocument();
    expect(screen.getByText("Ara")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
    expect(screen.queryByText(/login/i)).not.toBeInTheDocument();
  });

  test("calls logout when Logout button clicked", () => {
    const mockLogout = vi.fn();
    authState = { user: { email: "a@x.com" }, logout: mockLogout };
    renderNav();

    fireEvent.click(screen.getByRole("button", { name: /logout/i }));
    expect(mockLogout).toHaveBeenCalled();
  });
});
