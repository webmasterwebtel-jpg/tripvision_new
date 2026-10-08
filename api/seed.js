import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { pool, query } from './db.js';

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const accounts = [
  { email: 'web@webtel.sn', name: 'IT TripVision', role: 'it', password: requiredEnv('IT_PASSWORD') },
  { email: 'admin@tripvision.fr', name: 'Admin TripVision', role: 'admin', password: requiredEnv('ADMIN_PASSWORD') },
  { email: 'manager@tripvision.fr', name: 'Manager TripVision', role: 'manager', password: requiredEnv('MANAGER_PASSWORD') },
];

async function run() {
  for (const acc of accounts) {
    const existing = await query('SELECT id FROM users WHERE email = $1', [acc.email]);
    if (existing.rows.length) {
      console.log(`- ${acc.email} existe déjà, ignoré`);
      continue;
    }
    const passwordHash = await bcrypt.hash(acc.password, 10);
    await query(
      'INSERT INTO users(email, name, role, password_hash, must_change_password) VALUES ($1,$2,$3,$4,false)',
      [acc.email, acc.name, acc.role, passwordHash]
    );
    console.log(`✓ compte ${acc.role} créé : ${acc.email}`);
  }
  await pool.end();
}

run().catch(err => { console.error(err); process.exit(1); });
