import { Pool } from "pg";
import { SCHEMA_SQL } from "./schema";

/** Acepta DATABASE_URL, POSTGRES_URL (Vercel Postgres / Neon / Supabase). */
export const dbUrl = () => process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_PRISMA_URL || "";
export const dbConfigurada = () => !!dbUrl();

const g = globalThis as unknown as { __mzPool?: Pool; __mzSchema?: Promise<void> };

export function pool(): Pool {
  if (!g.__mzPool) {
    const url = dbUrl();
    const local = /localhost|127\.0\.0\.1/.test(url);
    g.__mzPool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 10_000, ssl: local ? undefined : { rejectUnauthorized: false } });
  }
  return g.__mzPool;
}

/** Crea las tablas la primera vez (idempotente). */
export function ensureSchema(): Promise<void> {
  if (!g.__mzSchema) {
    g.__mzSchema = pool()
      .query(SCHEMA_SQL)
      .then(() => undefined)
      .catch((e) => {
        g.__mzSchema = undefined;
        throw e;
      });
  }
  return g.__mzSchema;
}

export async function q<T = Record<string, unknown>>(text: string, params: unknown[] = []): Promise<T[]> {
  await ensureSchema();
  const r = await pool().query(text, params);
  return r.rows as T[];
}
