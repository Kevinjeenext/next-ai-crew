/**
 * PostgreSQL adapter that provides a DatabaseSync-compatible async interface.
 *
 * Strategy (Option B from CTO Soojin):
 * Instead of rewriting 138 files from sync → async, we provide an adapter
 * that matches the DatabaseSync shape but uses pg Pool underneath.
 *
 * Since Express route handlers can be async, the main change is making
 * the call sites await the results. For the MVP, we use a thin wrapper.
 */
import pg from "pg";

const { Pool } = pg;

export interface PgStatement {
  get(...params: unknown[]): Promise<Record<string, unknown> | undefined>;
  all(...params: unknown[]): Promise<Record<string, unknown>[]>;
  run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid?: number }>;
}

export interface PgDatabase {
  /** Execute raw SQL (DDL, multi-statement) */
  exec(sql: string): Promise<void>;
  /** Prepare a parameterized statement */
  prepare(sql: string): PgStatement;
  /** Transaction state flag (mirrors DatabaseSync) */
  isTransaction?: boolean;
  /** Close the pool */
  close(): Promise<void>;
  /** Underlying pg Pool for advanced use */
  pool: pg.Pool;
}

/**
 * Convert SQLite-style `?` positional params to Postgres `$1, $2, ...`
 */
function convertParams(sql: string): string {
  let idx = 0;
  return sql.replace(/\?/g, () => `$${++idx}`);
}

/**
 * Convert common SQLite functions to Postgres equivalents.
 * This handles the most common patterns found in the codebase.
 */
function convertSqliteToPostgres(sql: string): string {
  let result = sql;

  // unixepoch()*1000 → EXTRACT(EPOCH FROM NOW())::bigint * 1000
  result = result.replace(/unixepoch\(\)\s*\*\s*1000/g, "EXTRACT(EPOCH FROM NOW())::bigint * 1000");

  // INTEGER PRIMARY KEY AUTOINCREMENT → SERIAL PRIMARY KEY (handled in schema, but just in case)
  result = result.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, "SERIAL PRIMARY KEY");

  // SQLite's PRAGMA statements → no-op for PG
  if (/^\s*PRAGMA\s/i.test(result)) {
    return ""; // skip PRAGMAs
  }

  return result;
}

export function createPgDatabase(connectionString: string): PgDatabase {
  const pool = new Pool({
    connectionString,
    max: 20,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Supabase requires SSL in production
    ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (err) => {
    console.error("[Next AI Crew] PG pool error:", err.message);
  });

  const db: PgDatabase = {
    isTransaction: false,
    pool,

    async exec(sql: string): Promise<void> {
      const converted = convertSqliteToPostgres(sql);
      if (!converted.trim()) return; // skip empty (e.g., PRAGMAs)

      const client = await pool.connect();
      try {
        await client.query(converted);
      } finally {
        client.release();
      }
    },

    prepare(sql: string): PgStatement {
      const pgSql = convertParams(convertSqliteToPostgres(sql));

      return {
        async get(...params: unknown[]): Promise<Record<string, unknown> | undefined> {
          const client = await pool.connect();
          try {
            const result = await client.query(pgSql, params);
            return result.rows[0] as Record<string, unknown> | undefined;
          } finally {
            client.release();
          }
        },

        async all(...params: unknown[]): Promise<Record<string, unknown>[]> {
          const client = await pool.connect();
          try {
            const result = await client.query(pgSql, params);
            return result.rows as Record<string, unknown>[];
          } finally {
            client.release();
          }
        },

        async run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid?: number }> {
          const client = await pool.connect();
          try {
            const result = await client.query(pgSql, params);
            return { changes: result.rowCount ?? 0 };
          } finally {
            client.release();
          }
        },
      };
    },

    async close(): Promise<void> {
      await pool.end();
    },
  };

  return db;
}
