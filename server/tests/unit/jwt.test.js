import { signJwt, verifyJwt } from "../../src/utils/jwt.js";

describe("jwt utils", () => {
  test("sign & verify roundtrip", () => {
    const token = signJwt({ sub: 123 }, { expiresIn: "1h" });
    const payload = verifyJwt(token);
    expect(payload.sub ?? payload.userId).toBe(123);
  });

  test("verify returns null (or throws) on invalid token", () => {
    try {
      const res = verifyJwt("garbage.token.here");
      expect(res == null).toBe(true);
    } catch (e) {
      expect(e).toBeTruthy();
    }
  });
});
