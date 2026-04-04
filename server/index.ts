/**
 * Next AI Crew — Server entry point.
 *
 * Routes to PG/Supabase mode when DATABASE_URL is set,
 * otherwise falls back to SQLite mode (original Claw-Empire behavior).
 */
if (process.env.DATABASE_URL) {
  console.log("[Next AI Crew] DATABASE_URL detected → Supabase/PG mode");
  await import("./server-main-pg.ts");
} else {
  console.log("[Next AI Crew] No DATABASE_URL → SQLite mode (local development)");
  await import("./server-main.ts");
}
