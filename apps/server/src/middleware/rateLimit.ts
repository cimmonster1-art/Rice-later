/**
 * rateLimit — tiny dependency-free fixed-window limiter keyed by IP.
 *
 * Priority (owner) callers get a higher ceiling so their guaranteed access is
 * never throttled to the anonymous limit. Adequate for a single-process
 * prototype; swap for Redis-backed limiting behind a load balancer.
 */
import type { Request, Response, NextFunction } from "express";
import { isPriorityRequest } from "../services/priorityAccess.js";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  /** Requests per window for anonymous callers. */
  max: number;
  /** Requests per window for priority callers (defaults to `max`). */
  priorityMax?: number;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max } = opts;
  return (req: Request, res: Response, next: NextFunction): void => {
    const priority = isPriorityRequest(req);
    const limit = priority ? opts.priorityMax ?? max : max;
    const key = `${priority ? "p" : "a"}:${req.ip || req.socket.remoteAddress || "unknown"}`;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(limit));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, limit - bucket.count)));
    if (bucket.count > limit) {
      res.status(429).json({ error: "Too many requests. Slow down." });
      return;
    }
    next();
  };
}

/** Test helper. */
export function __resetRateLimit(): void {
  buckets.clear();
}
