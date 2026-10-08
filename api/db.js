import 'dotenv/config';
import pg from 'pg';

const { Pool, types } = pg;
// Les colonnes DATE restent des chaînes "AAAA-MM-JJ" (sinon elles deviennent des horodatages UTC).
types.setTypeParser(1082, (value) => value);

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error('Missing required environment variable: DATABASE_URL');

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase.co') ? { rejectUnauthorized: false } : undefined,
});

export const query = (text, params) => pool.query(text, params);
