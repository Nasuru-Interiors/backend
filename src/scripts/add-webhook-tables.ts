import { sql } from '../lib/db';
import { env } from '../lib/env';

async function addWebhookTables() {
  console.log('Adding webhook tables...');

  // Webhook endpoints table
  await sql`
    CREATE TABLE IF NOT EXISTS public.webhook_endpoints (
      id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name          TEXT NOT NULL,
      url           TEXT NOT NULL,
      secret        TEXT NOT NULL,
      events        TEXT[] NOT NULL DEFAULT '{}',
      active        BOOLEAN NOT NULL DEFAULT TRUE,
      description   TEXT,
      created_by    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Webhook deliveries table (audit log + retry tracking)
  await sql`
    CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
      id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      endpoint_id        UUID NOT NULL REFERENCES public.webhook_endpoints(id) ON DELETE CASCADE,
      event_type         TEXT NOT NULL,
      payload            JSONB NOT NULL,
      response_status    INT,
      response_body      TEXT,
      response_headers   JSONB,
      attempt            INT NOT NULL DEFAULT 1,
      max_attempts       INT NOT NULL DEFAULT 5,
      next_retry_at      TIMESTAMPTZ,
      delivered_at       TIMESTAMPTZ,
      failed_at          TIMESTAMPTZ,
      error_message      TEXT,
      created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  // Indexes for performance
  await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_endpoint ON public.webhook_deliveries(endpoint_id);`;
  await sql`CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_retry ON public.webhook_deliveries(next_retry_at) WHERE delivered_at IS NULL AND failed_at IS NULL AND attempt < max_attempts;`;
  await sql`CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON public.webhook_endpoints(active) WHERE active = TRUE;`;

  // Trigger for updated_at
  await sql`DROP TRIGGER IF EXISTS trg_webhook_endpoints_updated ON public.webhook_endpoints;`;
  await sql`
    CREATE TRIGGER trg_webhook_endpoints_updated BEFORE UPDATE ON public.webhook_endpoints
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  `;

  console.log('Webhook tables created successfully!');
}

if (require.main === module) {
  addWebhookTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}

export { addWebhookTables };