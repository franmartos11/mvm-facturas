const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgres://mvm:mvm_secret@localhost:5432/mvm_facturas'
});

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('Migrando tablas de chat y tango a B2B (company_id)...');

    // Mapeo user -> company para la migración
    const usersRes = await client.query('SELECT u.id as user_id, cm.company_id FROM users u LEFT JOIN company_members cm ON u.id = cm.user_id');
    const userCompanyMap = {};
    usersRes.rows.forEach(r => {
      if (r.company_id) userCompanyMap[r.user_id] = r.company_id;
    });

    // --- chat_sessions ---
    console.log('Migrando chat_sessions...');
    await client.query('ALTER TABLE chat_sessions ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE');
    const sessions = await client.query('SELECT id, user_id FROM chat_sessions');
    for (const session of sessions.rows) {
      const companyId = userCompanyMap[session.user_id];
      if (companyId) {
        await client.query('UPDATE chat_sessions SET company_id = $1 WHERE id = $2', [companyId, session.id]);
      } else {
        await client.query('DELETE FROM chat_sessions WHERE id = $1', [session.id]); // huerfanos
      }
    }
    await client.query('ALTER TABLE chat_sessions DROP COLUMN user_id');

    // --- chat_history ---
    console.log('Migrando chat_history...');
    await client.query('ALTER TABLE chat_history ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE');
    const histories = await client.query('SELECT id, user_id FROM chat_history');
    for (const hist of histories.rows) {
      const companyId = userCompanyMap[hist.user_id];
      if (companyId) {
        await client.query('UPDATE chat_history SET company_id = $1 WHERE id = $2', [companyId, hist.id]);
      } else {
        await client.query('DELETE FROM chat_history WHERE id = $1', [hist.id]);
      }
    }
    await client.query('ALTER TABLE chat_history DROP COLUMN user_id');

    // --- tango_mappings ---
    console.log('Migrando tango_mappings...');
    await client.query('ALTER TABLE tango_mappings DROP CONSTRAINT IF EXISTS tango_mappings_user_id_mapping_type_source_name_key');
    await client.query('ALTER TABLE tango_mappings ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE');
    
    const mappings = await client.query('SELECT id, user_id FROM tango_mappings');
    for (const mapping of mappings.rows) {
      const companyId = userCompanyMap[mapping.user_id];
      if (companyId) {
        await client.query('UPDATE tango_mappings SET company_id = $1 WHERE id = $2', [companyId, mapping.id]);
      } else {
        await client.query('DELETE FROM tango_mappings WHERE id = $1', [mapping.id]);
      }
    }
    await client.query('ALTER TABLE tango_mappings DROP COLUMN user_id');
    await client.query('ALTER TABLE tango_mappings ADD CONSTRAINT tango_mappings_company_id_mapping_type_source_name_key UNIQUE (company_id, mapping_type, source_name)');

    await client.query('COMMIT');
    console.log('Migración v8 exitosa.');
    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error en migración v8:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
