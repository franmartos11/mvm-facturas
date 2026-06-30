import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const query = <T = unknown>(text: string, params?: unknown[]) =>
  pool.query<T & Record<string, unknown>>(text, params);

export default pool;
