import { describe, test, expect, vi, beforeEach } from "vitest";

// Because we import after setting up fetch mocks, we can inspect calls inside api methods
let fetchMock;

// Minimal helpers to craft fake fetch responses
function mockFetchOnce({ status = 200, json, text, contentType } = {}) {
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    if (json && !contentType) headers.set("content-type", "application/json; charset=utf-8");
    if (text && !contentType) headers.set("content-type", "text/plain; charset=utf-8");
    fetchMock.mockResolvedValueOnce({
        ok: status >= 200 && status < 300,
        status,
        headers,
        json: async () => json,
        text: async () => (typeof text === "string" ? text : ""),
    });
}

beforeEach(() => {
    // Fresh fetch mock for each test
    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    vi.resetModules(); // ensure a clean import of apiClient each time
});

describe("apiClient request() & qs()", () => {
    test("request: returns parsed JSON on 200 + application/json", async () => {
        mockFetchOnce({ json: { ok: 1 } });
        const { api } = await import("../apiClient.js");
        const data = await api.get("/ping");
        expect(data).toEqual({ ok: 1 });
    });

    test("request: returns text body when not JSON", async () => {
        mockFetchOnce({ text: "pong", contentType: "text/plain" });
        const { api } = await import("../apiClient.js");
        const data = await api.get("/ping");
        expect(data).toBe("pong");
    });

    test("request: sets JSON header only when body is present", async () => {
        mockFetchOnce({ json: { created: true } });
        const { api } = await import("../apiClient.js");
        await api.post("/things", { name: "Luna" });

        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, opts] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/things$/);
        expect(opts.method).toBe("POST");
        expect(opts.headers["Content-Type"] || opts.headers["content-type"]).toMatch(/application\/json/i);
        expect(opts.body).toBe(JSON.stringify({ name: "Luna" }));

        // Now GET without body: no JSON header
        mockFetchOnce({ json: { ok: true } });
        await api.get("/things");

        const [, opts2] = fetchMock.mock.calls[1];
        expect(opts2.method).toBe("GET");
        expect(opts2.headers["Content-Type"] || opts2.headers["content-type"]).toBeUndefined();
        expect(opts2.body).toBeUndefined();
    });

    test("request: throws formatted error from JSON error field", async () => {
        mockFetchOnce({
            status: 400,
            json: { error: "Bad input" },
            contentType: "application/json",
        });
        const { api } = await import("../apiClient.js");
        await expect(api.get("/bad")).rejects.toThrow("400: Bad input");
    });

    test("request: throws formatted error from text body", async () => {
        mockFetchOnce({
            status: 500,
            text: "Internal error",
            contentType: "text/plain",
        });
        const { api } = await import("../apiClient.js");
        await expect(api.get("/boom")).rejects.toThrow("500: Internal error");
    });

    test("qs: drops undefined/null/empty and trims values", async () => {
        const mod = await import("../apiClient.js");
        // Access qs via an API method that uses it (moonToday)
        mockFetchOnce({ json: { ok: true } });

        await mod.api.moonToday({
            location: "  Boise, ID  ",
            empty: "   ",
            none: null,
            undef: undefined,
            lat: 43.6,
            lon: -116.2,
        });

        const [url] = fetchMock.mock.calls[0];
        // Should include trimmed location and lat/lon, not empty/none/undef
        expect(url).toMatch(/location=Boise%2C\+ID/);
        expect(url).toMatch(/lat=43\.6/);
        expect(url).toMatch(/lon=-116\.2/);
        expect(url).not.toMatch(/empty=|none=|undef=/);
    });
});

describe("apiClient endpoints", () => {
    test("login POSTs email/password", async () => {
        mockFetchOnce({ json: {} }); // /auth/login
        mockFetchOnce({ json: { user: { email: "a@x.com" } } }); // /auth/me after login
        const { api } = await import("../apiClient.js");
        await api.login("a@x.com", "passpass123");

        const [loginUrl, loginOpts] = fetchMock.mock.calls[0];
        expect(loginUrl).toMatch(/\/auth\/login$/);
        expect(loginOpts.method).toBe("POST");
        expect(loginOpts.body).toBe(JSON.stringify({ email: "a@x.com", password: "passpass123" }));
    });

    test("signup trims displayName and omits when blank", async () => {
        // Case 1: with displayName
        mockFetchOnce({ json: { user: { email: "b@x.com", displayName: "Ara" } } });
        const { api } = await import("../apiClient.js");
        await api.signup("b@x.com", "passpass123", "  Ara  ");

        let [url, opts] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/auth\/register$/);
        expect(JSON.parse(opts.body)).toEqual({ email: "b@x.com", password: "passpass123", displayName: "Ara" });

        // Case 2: blank displayName
        fetchMock.mockClear();
        mockFetchOnce({ json: { user: { email: "c@x.com" } } });
        await api.signup("c@x.com", "passpass123", "   ");

        [url, opts] = fetchMock.mock.calls[0];
        expect(JSON.parse(opts.body)).toEqual({ email: "c@x.com", password: "passpass123" });
    });

    test("moonToday overload: object param vs (lat, lon)", async () => {
        const { api } = await import("../apiClient.js");

        // object param
        mockFetchOnce({ json: { ok: true } });
        await api.moonToday({ location: "Boise" });
        let [url] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/moon\/today\?location=Boise$/);

        // (lat, lon)
        fetchMock.mockClear();
        mockFetchOnce({ json: { ok: true } });
        await api.moonToday(1.23, 4.56);
        [url] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/moon\/today\?lat=1\.23&lon=4\.56$/);
    });

    test("moonOn composes date + where params", async () => {
        const { api } = await import("../apiClient.js");

        mockFetchOnce({ json: { ok: true } });
        await api.moonOn("2025-09-08", { location: "Boise, ID" });
        let [url] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/moon\/on\?date=2025-09-08&location=Boise%2C\+ID$/);

        fetchMock.mockClear();
        mockFetchOnce({ json: { ok: true } });
        await api.moonOn("2025-09-08", { lat: 43.6, lon: -116.2 });
        ;[url] = fetchMock.mock.calls[0];
        expect(url).toMatch(/\/moon\/on\?date=2025-09-08&lat=43\.6&lon=-116\.2$/);
    });
});
