import { sql } from '../lib/db';
import { env } from '../lib/env';

async function addInboundUrlColumn() {
  console.log('Adding inbound_url column to webhook_endpoints...');

  // Add inbound_url column
  await sql`
    ALTER TABLE public.webhook_endpoints 
    ADD COLUMN IF NOT EXISTS inbound_url TEXT UNIQUE,
    ADD COLUMN IF NOT EXISTS is_inbound BOOLEAN NOT NULL DEFAULT FALSE;
  `;

  // Create index for inbound lookups
  await sql`
    CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_inbound_url 
    ON public.webhook_endpoints(inbound_url) WHERE inbound_url IS NOT NULL;
  `;

  console.log('Inbound URL column added successfully!');
}

if (require.main === module) {
  addInboundUrlColumn()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { addInboundUrlColumn };