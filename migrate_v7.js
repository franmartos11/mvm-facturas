const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    console.log('Creando tabla companies...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS companies (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        cuit TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    console.log('Creando tabla company_members...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS company_members (
        id SERIAL PRIMARY KEY,
        company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL DEFAULT 'member',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(company_id, user_id)
      );
    `);

    console.log('Migrando usuarios a empresas...');
    // Obtener todos los usuarios que tienen facturas o que existen
    const usersRes = await client.query('SELECT id, email FROM users');
    
    for (const user of usersRes.rows) {
      // Create a company for each user
      const companyName = user.email.split('@')[0];
      const compRes = await client.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [companyName]
      );
      const companyId = compRes.rows[0].id;

      // Assign user as admin
      await client.query(
        'INSERT INTO company_members (company_id, user_id, role) VALUES ($1, $2, $3)',
        [companyId, user.id, 'admin']
      );

      // Migrar facturas y presupuestos temporalmente antes de alterar las columnas
      console.log(`Migrando datos del usuario ${user.email} a la empresa ${companyId}...`);
      
      // Chequear si existe la columna company_id en invoices. Si no, crearla y permitir nulos primero.
      const invColRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='invoices' and column_name='company_id'
      `);
      if (invColRes.rows.length === 0) {
        await client.query('ALTER TABLE invoices ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE');
      }
      
      await client.query('UPDATE invoices SET company_id = $1 WHERE user_id = $2', [companyId, user.id]);

      // Igual para budgets
      const budColRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='budgets' and column_name='company_id'
      `);
      if (budColRes.rows.length === 0) {
        await client.query('ALTER TABLE budgets ADD COLUMN company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE');
        await client.query('ALTER TABLE budgets DROP CONSTRAINT budgets_user_id_category_key');
        await client.query('ALTER TABLE budgets ADD CONSTRAINT budgets_company_id_category_key UNIQUE(company_id, category)');
      }
      
      await client.query('UPDATE budgets SET company_id = $1 WHERE user_id = $2', [companyId, user.id]);
    }

    console.log('Eliminando columna user_id y haciendo company_id NOT NULL...');
    
    // Invoices
    await client.query('ALTER TABLE invoices ALTER COLUMN company_id SET NOT NULL');
    await client.query('ALTER TABLE invoices DROP COLUMN user_id');

    // Budgets
    await client.query('ALTER TABLE budgets ALTER COLUMN company_id SET NOT NULL');
    await client.query('ALTER TABLE budgets DROP COLUMN user_id');

    await client.query('COMMIT');
    console.log('Migración completada exitosamente.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Error en la migración:', e);
  } finally {
    client.release();
    pool.end();
  }
}

main();
