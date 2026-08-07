import fs from 'fs';
import path from 'path';
import { sql } from '../lib/db';

function splitSqlStatements(sqlText: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = sqlText.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!inDollarQuote && trimmed.startsWith('--')) {
      continue;
    }

    let idx = 0;
    while (idx < line.length) {
      const char = line[idx];

      if (char === '$') {
        const match = line.slice(idx).match(/^\$[a-zA-Z0-9_]*\$/);
        if (match) {
          const tag = match[0];
          if (!inDollarQuote) {
            inDollarQuote = true;
            dollarTag = tag;
          } else if (dollarTag === tag) {
            inDollarQuote = false;
            dollarTag = '';
          }
          current += tag;
          idx += tag.length;
          continue;
        }
      }

      if (char === ';' && !inDollarQuote) {
        if (current.trim()) {
          statements.push(current.trim());
        }
        current = '';
      } else {
        current += char;
      }
      idx++;
    }
    current += '\n';
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

async function main() {
  console.log('Applying database schema to Neon Database...');

  const schemaPath = path.resolve(__dirname, '../../../database/schema.sql');
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`schema.sql file not found at ${schemaPath}`);
  }

  const schemaSql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitSqlStatements(schemaSql);

  console.log(`Executing ${statements.length} SQL statements...`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await sql(stmt);
    } catch (err) {
      console.error(`❌ Statement ${i + 1} failed:`, stmt);
      throw err;
    }
  }

  console.log(`✅ Database schema & tables migrated successfully!`);
}

main().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
