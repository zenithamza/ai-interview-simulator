import { test, describe, before } from "node:test";
import assert from "node:assert/strict";

before(() => {
  process.env.JWT_SECRET = "test-secret-for-unit-tests-only";
});

const { signToken, verifyToken } = await import("../utils/jwt.js");

describe("jwt", () => {
  test("signs and verifies a round trip", () => {
    const fakeUser = { _id: { toString: () => "abc123" }, email: "test@example.com" };
    const token = signToken(fakeUser);
    const payload = verifyToken(token);
    assert.equal(payload.sub, "abc123");
    assert.equal(payload.email, "test@example.com");
  });

  test("rejects a tampered token", () => {
    const fakeUser = { _id: { toString: () => "abc123" }, email: "test@example.com" };
    const token = signToken(fakeUser);
    const tampered = token.slice(0, -2) + "xx";
    assert.throws(() => verifyToken(tampered));
  });
});
