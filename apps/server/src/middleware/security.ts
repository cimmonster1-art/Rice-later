/**
 * security — minimal hardening headers + permissive-but-scoped CORS for the
 * extension. Dependency-free to keep the prototype lean.
 */
import type { Request, Response, NextFunction } from "express";

export function securityHeaders(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=()"
  );
  next();
}

/**
 * CORS for the API. Chrome extensions send an Origin like
 * chrome-extension://<id>. We allow extension origins and the configured
 * APP_URL; everything else is rejected for credentialed-style access.
 */
export function cors(req: Request, res: Response, next: NextFunction): void {
  const origin = req.headers.origin;
  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const allowed =
    !origin ||
    origin.startsWith("chrome-extension://") ||
    origin.startsWith("moz-extension://") ||
    origin === appUrl;

  if (allowed && origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Vary", "Origin");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }
  next();
}
