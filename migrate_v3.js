const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://mvm:mvm_secret@localhost:5432/mvm_facturas'
});

async function migrate() {
  try {
    console.log('Adding new columns to invoices...');
    
    await pool.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='payment_method') THEN
              ALTER TABLE invoices ADD COLUMN payment_method TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='currency') THEN
              ALTER TABLE invoices ADD COLUMN currency TEXT DEFAULT 'ARS';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='due_date') THEN
              ALTER TABLE invoices ADD COLUMN due_date DATE;
          END IF;
      END
      $$;
    `);
    
    console.log('Migration v3 successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
