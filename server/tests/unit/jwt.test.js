import { signJwt, verifyJwt } from "../../src/utils/jwt.js";

describe("jwt utils", () => {
  test("sign & verify roundtrip", () => {
    // no options; util uses 7d internally
    const token = signJwt({ sub: 123 });
    const payload = verifyJwt(token);
    expect(payload && payload.sub).toBe(123);
  });

  test("verify returns null on invalid token", () => {
    const res = verifyJwt("garbage.token.here");
    expect(res).toBeNull();
  });
});
