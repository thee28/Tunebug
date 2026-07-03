import { describe, it, expect } from "vitest";
import { isValidScore, readJson } from "@/lib/api/validation";
import { rateLimit } from "@/lib/api/rateLimit";

describe("isValidScore", () => {
  it("accepts integers 0..100", () => {
    expect(isValidScore(0)).toBe(true);
    expect(isValidScore(70)).toBe(true);
    expect(isValidScore(100)).toBe(true);
  });

  it("rejects NaN, floats, out-of-range, and non-numbers", () => {
    expect(isValidScore(NaN)).toBe(false);
    expect(isValidScore(50.5)).toBe(false);
    expect(isValidScore(-1)).toBe(false);
    expect(isValidScore(101)).toBe(false);
    expect(isValidScore("70")).toBe(false);
    expect(isValidScore(null)).toBe(false);
    expect(isValidScore(Infinity)).toBe(false);
  });
});

describe("readJson", () => {
  function req(body: string) {
    return new Request("http://test.local", { method: "POST", body });
  }

  it("returns parsed object for valid JSON objects", async () => {
    expect(await readJson(req('{"a":1}'))).toEqual({ a: 1 });
  });

  it("returns null for malformed JSON, arrays, and primitives", async () => {
    expect(await readJson(req("not json"))).toBeNull();
    expect(await readJson(req("[1,2]"))).toBeNull();
    expect(await readJson(req("42"))).toBeNull();
    expect(await readJson(req("null"))).toBeNull();
  });
});

describe("rateLimit", () => {
  it("allows up to the limit then blocks within the window", () => {
    const key = `test:${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000)).toBe(true);
    }
    expect(rateLimit(key, 5, 60_000)).toBe(false);
  });

  it("tracks keys independently", () => {
    const a = `test:${Math.random()}`;
    const b = `test:${Math.random()}`;
    expect(rateLimit(a, 1, 60_000)).toBe(true);
    expect(rateLimit(a, 1, 60_000)).toBe(false);
    expect(rateLimit(b, 1, 60_000)).toBe(true);
  });
});
