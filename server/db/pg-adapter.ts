/**
 * PostgreSQL adapter using Supabase JS client.
 *
 * Strategy: Use supabase-js .from() API instead of raw SQL.
 * This provides automatic RLS, Realtime compatibility, and cleaner code.
 *
 * Architecture Guide (CTO Soojin, 2026-04-05):
 * - Server-side uses service_role client (bypasses RLS for admin ops)
 * - All tables have org_id for multi-tenancy
 * - Client-side uses anon key (RLS enforced)
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "../lib/supabase.ts";

// ---------------------------------------------------------------------------
// Core query helpers (used by route handlers)
// ---------------------------------------------------------------------------

/**
 * Query all rows from a table, filtered by org_id.
 */
export async function queryAll<T = Record<string, unknown>>(
  table: string,
  orgId: string,
  filters?: Record<string, unknown>,
  options?: {
    orderBy?: string;
    ascending?: boolean;
    limit?: number;
    client?: SupabaseClient;
  },
): Promise<T[]> {
  const client = options?.client ?? supabaseAdmin;
  let q = client.from(table).select("*").eq("org_id", orgId);

  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      q = q.eq(k, v);
    }
  }
  if (options?.orderBy) {
    q = q.order(options.orderBy, { ascending: options.ascending ?? false });
  }
  if (options?.limit) {
    q = q.limit(options.limit);
  }

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as T[];
}

/**
 * Query a single row by org_id + id.
 */
export async function queryOne<T = Record<string, unknown>>(
  table: string,
  orgId: string,
  id: string,
  client?: SupabaseClient,
): Promise<T | null> {
  const c = client ?? supabaseAdmin;
  const { data, error } = await c.from(table).select("*").eq("org_id", orgId).eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }
  return data as T;
}

/**
 * Insert a row. Automatically sets created_at if not provided.
 */
export async function insertRow<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
  client?: SupabaseClient,
): Promise<T> {
  const c = client ?? supabaseAdmin;
  const { data, error } = await c.from(table).insert(row).select().single();
  if (error) throw error;
  return data as T;
}

/**
 * Insert multiple rows.
 */
export async function insertRows<T = Record<string, unknown>>(
  table: string,
  rows: Record<string, unknown>[],
  client?: SupabaseClient,
): Promise<T[]> {
  const c = client ?? supabaseAdmin;
  const { data, error } = await c.from(table).insert(rows).select();
  if (error) throw error;
  return (data ?? []) as T[];
}

/**
 * Update a row by org_id + id.
 */
export async function updateRow<T = Record<string, unknown>>(
  table: string,
  orgId: string,
  id: string,
  updates: Record<string, unknown>,
  client?: SupabaseClient,
): Promise<T | null> {
  const c = client ?? supabaseAdmin;
  const { data, error } = await c
    .from(table)
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("org_id", orgId)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw error;
  }
  return data as T;
}

/**
 * Delete a row by org_id + id.
 */
export async function deleteRow(
  table: string,
  orgId: string,
  id: string,
  client?: SupabaseClient,
): Promise<boolean> {
  const c = client ?? supabaseAdmin;
  const { error, count } = await c
    .from(table)
    .delete({ count: "exact" })
    .eq("org_id", orgId)
    .eq("id", id);

  if (error) throw error;
  return (count ?? 0) > 0;
}

/**
 * Upsert a row (insert or update on conflict).
 */
export async function upsertRow<T = Record<string, unknown>>(
  table: string,
  row: Record<string, unknown>,
  options?: { onConflict?: string; client?: SupabaseClient },
): Promise<T> {
  const c = options?.client ?? supabaseAdmin;
  let q = c.from(table).upsert(row);
  if (options?.onConflict) {
    q = c.from(table).upsert(row, { onConflict: options.onConflict });
  }
  const { data, error } = await q.select().single();
  if (error) throw error;
  return data as T;
}

/**
 * Count rows matching filters.
 */
export async function countRows(
  table: string,
  orgId: string,
  filters?: Record<string, unknown>,
  client?: SupabaseClient,
): Promise<number> {
  const c = client ?? supabaseAdmin;
  let q = c.from(table).select("*", { count: "exact", head: true }).eq("org_id", orgId);

  if (filters) {
    for (const [k, v] of Object.entries(filters)) {
      q = q.eq(k, v);
    }
  }

  const { count, error } = await q;
  if (error) throw error;
  return count ?? 0;
}

/**
 * Read a setting value by key (from settings table).
 */
export async function readSetting(
  orgId: string,
  key: string,
  client?: SupabaseClient,
): Promise<string | undefined> {
  const c = client ?? supabaseAdmin;
  const { data, error } = await c
    .from("settings")
    .select("value")
    .eq("org_id", orgId)
    .eq("key", key)
    .single();

  if (error) {
    if (error.code === "PGRST116") return undefined;
    return undefined;
  }
  const val = data?.value;
  if (typeof val !== "string") return undefined;
  const trimmed = val.trim();
  return trimmed || undefined;
}

/**
 * Write a setting value.
 */
export async function writeSetting(
  orgId: string,
  key: string,
  value: string,
  client?: SupabaseClient,
): Promise<void> {
  const c = client ?? supabaseAdmin;
  const { error } = await c.from("settings").upsert(
    { org_id: orgId, key, value },
    { onConflict: "org_id,key" },
  );
  if (error) throw error;
}

/**
 * Execute a raw SQL query via Supabase RPC or pg.
 * Use sparingly — prefer the typed helpers above.
 */
export async function rawQuery(
  sql: string,
  params?: unknown[],
  client?: SupabaseClient,
): Promise<unknown[]> {
  const c = client ?? supabaseAdmin;
  // Supabase JS doesn't support raw SQL directly.
  // For complex queries, use RPC functions defined in Supabase.
  // This is a placeholder for migration — complex raw SQL should be
  // converted to RPC functions or typed queries.
  console.warn("[Next AI Crew] rawQuery called — consider converting to typed query:", sql.slice(0, 80));
  const { data, error } = await c.rpc("raw_sql", { query: sql, params: params ?? [] });
  if (error) throw error;
  return (data ?? []) as unknown[];
}

// ---------------------------------------------------------------------------
// Transaction helper
// ---------------------------------------------------------------------------

/**
 * Run multiple operations in sequence.
 * Note: Supabase JS doesn't support true transactions.
 * For MVP, we run operations sequentially and handle errors.
 * True transaction support requires Supabase Edge Functions with pg client.
 */
export async function runInSequence(fn: () => Promise<void>): Promise<void> {
  await fn();
}
