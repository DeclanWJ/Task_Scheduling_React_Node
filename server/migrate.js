require('dotenv').config();

const fs = require('node:fs/promises');
const path = require('node:path');
const { pool } = require('./database');

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      name TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationDirectory = path.join(__dirname, 'migrations');
  const migrationFiles = (await fs.readdir(migrationDirectory))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const name of migrationFiles) {
    const alreadyApplied = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE name = $1',
      [name],
    );

    if (alreadyApplied.rowCount > 0) {
      continue;
    }

    const sql = await fs.readFile(path.join(migrationDirectory, name), 'utf8');
    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [
        name,
      ]);
      await client.query('COMMIT');
      console.log(`Applied migration: ${name}`);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

migrate()
  .catch((error) => {
    console.error('Database migration failed:', error);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
