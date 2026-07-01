const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://mvm:mvm_secret@localhost:5432/mvm_facturas'
});

async function migrate() {
  try {
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                         WHERE table_name='invoices' AND column_name='tags') THEN
              ALTER TABLE invoices ADD COLUMN tags TEXT[];
          END IF;
      END
      $$;
    `);
    console.log('Added tags column');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, category)
      );
    `);
    console.log('Created budgets table');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
