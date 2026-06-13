/**
 * rateLimit — tiny dependency-free fixed-window limiter keyed by IP.
 * Adequate for a prototype; swap for Redis-backed limiting in production.
 */
import type { Request, Response, NextFunction } from "express";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  windowMs: number;
  max: number;
}

export function rateLimit(opts: RateLimitOptions) {
  const { windowMs, max } = opts;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - bucket.count)));
    if (bucket.count > max) {
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
