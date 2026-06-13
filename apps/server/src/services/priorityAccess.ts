/**
 * priorityAccess — decides whether an incoming request belongs to a priority
 * caller (the project owner).
 *
 * RiceLayer requires no account for normal use. Priority is proven by a secret
 * key the owner configures on the server (PRIORITY_ACCESS_KEYS) and mirrors in
 * their own extension; the key travels in the `x-ricelayer-key` header. An
 * email header alone is never trusted — anyone could send it — so a matching
 * secret key is always required.
 */

import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";
import { getConfig } from "../config.js";

export const PRIORITY_KEY_HEADER = "x-ricelayer-key";

/** Constant-time string comparison that tolerates length differences. */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Still compare against self to keep timing uniform, then fail.
    timingSafeEqual(bufA, bufA);
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

/** True when the presented key matches any configured priority key. */
export function isPriorityKey(key: string | undefined): boolean {
  if (!key) return false;
  const { priorityKeys } = getConfig();
  return priorityKeys.some((k) => safeEqual(k, key));
}

/** Extract the priority key header from a request, if present. */
export function readPriorityKey(req: Request): string | undefined {
  const header = req.headers[PRIORITY_KEY_HEADER];
  if (typeof header === "string" && header.trim()) return header.trim();
  return undefined;
}

/** Whether a request is from a priority (owner) caller. */
export function isPriorityRequest(req: Request): boolean {
  return isPriorityKey(readPriorityKey(req));
}
