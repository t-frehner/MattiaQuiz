import { Pool } from 'pg';

export const pool = new Pool({
  user: process.env.PGUSER ?? 'postgres',
  host: process.env.PGHOST ?? 'localhost',
  database: process.env.PGDATABASE ?? 'mattiaquiz',
  password: process.env.PGPASSWORD ?? 'postgres',
  port: Number(process.env.PGPORT ?? 5432),
});
