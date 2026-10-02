import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at ${schemaPath}`);
    }

    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute entire schema SQL in one shot
    await db.exec(schemaSql);

    // Auto-migrate missing columns if table already existed
    const tablesToMigrate = [
      {
        table: 'payments',
        columns: [
          { name: 'verified_at', type: 'TEXT' },
          { name: 'verified_by', type: 'TEXT' },
          { name: 'updated_at', type: 'TEXT' }
        ]
      },
      {
        table: 'notifications',
        columns: [
          { name: 'resource_type', type: "TEXT DEFAULT 'order'" },
          { name: 'resource_id', type: 'TEXT' }
        ]
      }
    ];

    for (const item of tablesToMigrate) {
      for (const col of item.columns) {
        try {
          await db.run(`ALTER TABLE ${item.table} ADD COLUMN ${col.name} ${col.type}`);
        } catch (e) {
          // Column already exists, ignore
        }
      }
    }

    console.log('✅ Database schema migration completed successfully.');
  } catch (error) {
    console.error('❌ Database migration error:', error);
    throw error;
  }
}

export default runMigrations;
