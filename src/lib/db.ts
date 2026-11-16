
import { Pool } from "pg";

const globalForPostgres = globalThis as typeof globalThis & {
  postgresPool?: Pool;
};

export const db =
  globalForPostgres.postgresPool ??
  new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPostgres.postgresPool = db;
}
