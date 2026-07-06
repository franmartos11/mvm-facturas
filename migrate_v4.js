const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://mvm:mvm_secret@localhost:5432/mvm_facturas'
});

async function migrate() {
  try {
    console.log('Adding new columns for advanced invoice extraction...');
    
    await pool.query(`
      DO $$
      BEGIN
          -- Nuevas columnas en invoices
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='invoice_number') THEN
              ALTER TABLE invoices ADD COLUMN invoice_number TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='supplier_cuit') THEN
              ALTER TABLE invoices ADD COLUMN supplier_cuit TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='customer_cuit') THEN
              ALTER TABLE invoices ADD COLUMN customer_cuit TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoices' AND column_name='customer_name') THEN
              ALTER TABLE invoices ADD COLUMN customer_name TEXT;
          END IF;

          -- Nuevas columnas en invoice_items
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='discount') THEN
              ALTER TABLE invoice_items ADD COLUMN discount NUMERIC DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='tax_rate') THEN
              ALTER TABLE invoice_items ADD COLUMN tax_rate NUMERIC DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='tax_amount') THEN
              ALTER TABLE invoice_items ADD COLUMN tax_amount NUMERIC DEFAULT 0;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='item_code') THEN
              ALTER TABLE invoice_items ADD COLUMN item_code TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='invoice_items' AND column_name='unit_of_measure') THEN
              ALTER TABLE invoice_items ADD COLUMN unit_of_measure TEXT;
          END IF;
      END
      $$;
    `);
    
    console.log('Migration v4 successful!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrate();
