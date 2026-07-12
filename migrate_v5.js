const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to the database');

    console.log('1. Creating tango_mappings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS tango_mappings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        mapping_type VARCHAR(50) NOT NULL, -- 'customer' or 'item'
        source_name VARCHAR(255) NOT NULL, -- e.g., supplier name or item description
        tango_code VARCHAR(255) NOT NULL,  -- e.g., CUIT or SKU
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, mapping_type, source_name)
      );
    `);
    console.log('tango_mappings table created.');

    console.log('2. Adding tango_token to users...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS tango_token VARCHAR(500);
    `);
    console.log('tango_token added.');

    console.log('3. Adding tango_synced to invoices...');
    await client.query(`
      ALTER TABLE invoices 
      ADD COLUMN IF NOT EXISTS tango_synced BOOLEAN DEFAULT false;
    `);
    console.log('tango_synced added.');

    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrate();
