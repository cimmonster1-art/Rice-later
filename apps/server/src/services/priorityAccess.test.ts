import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { Request } from "express";
import { __resetConfigForTests } from "../config.js";
import {
  isPriorityKey,
  isPriorityRequest,
  PRIORITY_KEY_HEADER,
} from "./priorityAccess.js";

function reqWithKey(key?: string): Request {
  return {
    headers: key ? { [PRIORITY_KEY_HEADER]: key } : {},
  } as unknown as Request;
}

describe("priorityAccess", () => {
  beforeEach(() => {
    __resetConfigForTests();
    process.env.PRIORITY_ACCESS_KEYS = "owner-secret-1, owner-secret-2";
  });

  afterEach(() => {
    delete process.env.PRIORITY_ACCESS_KEYS;
    __resetConfigForTests();
  });

  it("recognizes a configured priority key", () => {
    expect(isPriorityKey("owner-secret-1")).toBe(true);
    expect(isPriorityKey("owner-secret-2")).toBe(true);
  });

  it("rejects unknown or missing keys", () => {
    expect(isPriorityKey("nope")).toBe(false);
    expect(isPriorityKey(undefined)).toBe(false);
    expect(isPriorityKey("")).toBe(false);
  });

  it("reads the priority key from request headers", () => {
    expect(isPriorityRequest(reqWithKey("owner-secret-1"))).toBe(true);
    expect(isPriorityRequest(reqWithKey("wrong"))).toBe(false);
    expect(isPriorityRequest(reqWithKey())).toBe(false);
  });

  it("grants no priority when no keys are configured", () => {
    delete process.env.PRIORITY_ACCESS_KEYS;
    __resetConfigForTests();
    expect(isPriorityRequest(reqWithKey("owner-secret-1"))).toBe(false);
  });
});
