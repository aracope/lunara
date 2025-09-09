import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

// ---- Mock useAuth with a mutable state object
let authState = { user: null, authLoaded: false };
vi.mock("../../context/AuthContext.jsx", () => ({
  __esModule: true,
  useAuth: () => authState,
}));

import ProtectedRoute from "../ProtectedRoute.jsx";

// Test pages
function PrivatePage() {
  return <div>Secret Stuff</div>;
}
function LoginSpy() {
  const location = useLocation();
  return (
    <div>
      Login Page
      <div data-testid="from-path">{location.state?.from?.pathname || ""}</div>
    </div>
  );
}
function AppUnderTest() {
  return (
    <Routes>
      <Route path="/login" element={<LoginSpy />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/private" element={<PrivatePage />} />
      </Route>
    </Routes>
  );
}

describe("ProtectedRoute (Vite/Vitest)", () => {
  test("shows loading while auth is not yet loaded", () => {
    authState = { user: null, authLoaded: false };
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AppUnderTest />
      </MemoryRouter>
    );
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("redirects to /login with state.from when unauthenticated", async () => {
    authState = { user: null, authLoaded: true };
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AppUnderTest />
      </MemoryRouter>
    );

    expect(await screen.findByText(/login page/i)).toBeInTheDocument();
    expect(screen.getByTestId("from-path").textContent).toBe("/private");
  });

  test("renders outlet when authenticated", async () => {
    authState = { user: { id: 1, email: "a@x.com" }, authLoaded: true };
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <AppUnderTest />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/secret stuff/i)).toBeInTheDocument();
    });
  });
});
