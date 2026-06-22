/**
 * Vercel serverless entry point for the RiceLayer API.
 *
 * Vercel routes every request (see ../vercel.json rewrites) to this function.
 * We hand the request straight to the Express app from ../src/index.ts, so the
 * exact same app runs locally (`npm run dev`) and on Vercel — no duplication.
 */
import { createApp } from "../src/index.js";

const app = createApp();

export default app;
