/**
 * migrate_v6.js
 * Agrega:
 *   - invoice_type: 'compra' | 'venta' | null  (detectado por la IA)
 *   - anomaly_score: puntuación de anomalía (desviaciones estándar respecto a la media del proveedor+tipo)
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://mvm:mvm_secret@localhost:5432/mvm_facturas',
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Tipo de factura (compra o venta)
    await client.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT NULL
    `);
    console.log('✔ Columna invoice_type agregada');

    // 2. Puntuación de anomalía (número de desviaciones estándar sobre la media)
    await client.query(`
      ALTER TABLE invoices
        ADD COLUMN IF NOT EXISTS anomaly_score NUMERIC DEFAULT NULL
    `);
    console.log('✔ Columna anomaly_score agregada');

    await client.query('COMMIT');
    console.log('\n✅ Migración v6 completada con éxito.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en migración:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
