import { Router, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import {
  webhookEndpointSchema,
  webhookEndpointUpdateSchema,
  webhookDeliveryQuerySchema,
  webhookTestSchema,
} from '../validation/schemas';
import { generateWebhookSecret } from '../lib/webhook';

const router = Router();
router.use(requireAdmin);

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// List all webhook endpoints
router.get(
  '/webhooks',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT
        id, name, url, events, active, description, created_by, created_at, updated_at
      FROM public.webhook_endpoints
      ORDER BY created_at DESC
    `;
    // Don't return secrets in list
    res.json(rows ?? []);
  })
);

// Get single webhook endpoint (with secret for admin)
router.get(
  '/webhooks/:id',
  wrap(async (req, res) => {
    const rows = await sql`
      SELECT id, name, url, secret, events, active, description, created_by, created_at, updated_at
      FROM public.webhook_endpoints
      WHERE id = ${req.params.id}
      LIMIT 1
    `;
    if (!rows.length) {
      res.status(404).json({ error: 'Webhook endpoint not found' });
      return;
    }
    res.json(rows[0]);
  })
);

// Create webhook endpoint
router.post(
  '/webhooks',
  wrap(async (req, res) => {
    const body = webhookEndpointSchema.parse(req.body);
    const secret = body.secret || generateWebhookSecret();

    const inserted = await sql`
      INSERT INTO public.webhook_endpoints (name, url, secret, events, active, description, created_by)
      VALUES (${body.name}, ${body.url}, ${secret}, ${body.events}, ${body.active}, ${body.description ?? null}, ${req.userId ?? null})
      RETURNING id, name, url, secret, events, active, description, created_by, created_at, updated_at
    `;

    res.status(201).json(inserted[0]);
  })
);

// Update webhook endpoint
router.put(
  '/webhooks/:id',
  wrap(async (req, res) => {
    const body = webhookEndpointUpdateSchema.parse(req.body);

    // Build dynamic update
    const existingRows = await sql`SELECT * FROM public.webhook_endpoints WHERE id = ${req.params.id} LIMIT 1`;
    if (!existingRows.length) {
      res.status(404).json({ error: 'Webhook endpoint not found' });
      return;
    }
    const cur = existingRows[0];

    const updated = await sql`
      UPDATE public.webhook_endpoints SET
        name = ${body.name !== undefined ? body.name : cur.name},
        url = ${body.url !== undefined ? body.url : cur.url},
        events = ${body.events !== undefined ? body.events : cur.events},
        active = ${body.active !== undefined ? body.active : cur.active},
        description = ${body.description !== undefined ? body.description : cur.description},
        updated_at = NOW()
      WHERE id = ${req.params.id}
      RETURNING id, name, url, events, active, description, created_by, created_at, updated_at
    `;

    // If secret is being updated, handle separately
    if (body.secret !== undefined) {
      await sql`UPDATE public.webhook_endpoints SET secret = ${body.secret} WHERE id = ${req.params.id}`;
    }

    res.json(updated[0]);
  })
);

// Regenerate webhook secret
router.post(
  '/webhooks/:id/regenerate-secret',
  wrap(async (req, res) => {
    const newSecret = generateWebhookSecret();
    await sql`UPDATE public.webhook_endpoints SET secret = ${newSecret}, updated_at = NOW() WHERE id = ${req.params.id}`;
    res.json({ secret: newSecret });
  })
);

// Delete webhook endpoint
router.delete(
  '/webhooks/:id',
  wrap(async (req, res) => {
    const result = await sql`DELETE FROM public.webhook_endpoints WHERE id = ${req.params.id}`;
    if (result.length === 0) {
      res.status(404).json({ error: 'Webhook endpoint not found' });
      return;
    }
    res.json({ ok: true });
  })
);

// List webhook deliveries
router.get(
  '/webhooks/:id/deliveries',
  wrap(async (req, res) => {
    const query = webhookDeliveryQuerySchema.parse(req.query);

    const conditions: string[] = ['d.endpoint_id = $1'];
    const params: unknown[] = [req.params.id];
    let paramIndex = 2;

    if (query.event_type) {
      conditions.push(`d.event_type = $${paramIndex}`);
      params.push(query.event_type);
      paramIndex++;
    }
    if (query.status) {
      conditions.push(`CASE
        WHEN d.delivered_at IS NOT NULL THEN 'delivered'
        WHEN d.failed_at IS NOT NULL THEN 'failed'
        ELSE 'pending'
      END = $${paramIndex}`);
      params.push(query.status);
      paramIndex++;
    }

    params.push(query.limit, query.offset);

    const whereClause = conditions.join(' AND ');
    const limitParam = `$${paramIndex}`;
    const offsetParam = `$${paramIndex + 1}`;

    const queryText = `
      SELECT
        d.id, d.endpoint_id, d.event_type, d.payload, d.response_status,
        d.response_body, d.response_headers, d.attempt, d.max_attempts,
        d.next_retry_at, d.delivered_at, d.failed_at, d.error_message, d.created_at
      FROM public.webhook_deliveries d
      WHERE ${whereClause}
      ORDER BY d.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const rows = await sql(queryText, params);

    res.json(rows ?? []);
  })
);

// Get delivery stats for an endpoint
router.get(
  '/webhooks/:id/stats',
  wrap(async (req, res) => {
    const stats = await sql`
      SELECT
        COUNT(*)::int as total,
        COUNT(*) FILTER (WHERE delivered_at IS NOT NULL)::int as delivered,
        COUNT(*) FILTER (WHERE failed_at IS NOT NULL)::int as failed,
        COUNT(*) FILTER (WHERE delivered_at IS NULL AND failed_at IS NULL AND attempt < max_attempts)::int as pending,
        COUNT(*) FILTER (WHERE failed_at IS NOT NULL AND attempt >= max_attempts)::int as exhausted
      FROM public.webhook_deliveries
      WHERE endpoint_id = ${req.params.id}
    `;
    res.json(stats[0]);
  })
);

// Test webhook endpoint
router.post(
  '/webhooks/test',
  wrap(async (req, res) => {
    const body = webhookTestSchema.parse(req.body);

    const endpointRows = await sql`
      SELECT id, url, secret, events
      FROM public.webhook_endpoints
      WHERE id = ${body.endpoint_id}
      LIMIT 1
    `;

    if (!endpointRows.length) {
      res.status(404).json({ error: 'Webhook endpoint not found' });
      return;
    }

    const endpoint = endpointRows[0];
    const eventType = body.event_type || 'article.created';
    const testPayload = body.payload || {
      id: 'test-' + Date.now(),
      title: 'Test Article',
      slug: 'test-article',
      status: 'published',
      event: eventType,
      timestamp: new Date().toISOString(),
    };

    // Create delivery record
    const deliveryId = await sql`
      INSERT INTO public.webhook_deliveries (endpoint_id, event_type, payload, max_attempts, next_retry_at)
      VALUES (${body.endpoint_id}, ${eventType}, ${JSON.stringify(testPayload)}, 1, NOW())
      RETURNING id
    `.then(r => r[0].id as string);

    // Import deliverWebhook dynamically to avoid circular deps
    const { deliverWebhook, updateDeliveryRecord } = await import('../lib/webhook');

    const result = await deliverWebhook(
      endpoint.url as string,
      endpoint.secret as string,
      eventType,
      testPayload,
      deliveryId,
      1,
      1
    );

    await updateDeliveryRecord(deliveryId, {
      responseStatus: result.status,
      responseBody: result.body,
      responseHeaders: result.headers,
      errorMessage: result.error,
      success: result.success,
      attempt: 1,
      maxAttempts: 1,
    });

    res.json({
      success: result.success,
      status: result.status,
      response: result.body,
      error: result.error,
    });
  })
);

// Retry failed delivery
router.post(
  '/webhooks/deliveries/:deliveryId/retry',
  wrap(async (req, res) => {
    const deliveryRows = await sql`
      SELECT d.*, e.url, e.secret
      FROM public.webhook_deliveries d
      JOIN public.webhook_endpoints e ON e.id = d.endpoint_id
      WHERE d.id = ${req.params.deliveryId}
      LIMIT 1
    `;

    if (!deliveryRows.length) {
      res.status(404).json({ error: 'Delivery not found' });
      return;
    }

    const delivery = deliveryRows[0];

    if (delivery.delivered_at) {
      res.status(400).json({ error: 'Delivery already succeeded' });
      return;
    }

    if (delivery.attempt >= delivery.max_attempts) {
      res.status(400).json({ error: 'Max retries exceeded' });
      return;
    }

    // Reset for retry
    await sql`
      UPDATE public.webhook_deliveries
      SET error_message = NULL, next_retry_at = NOW()
      WHERE id = ${req.params.deliveryId}
    `;

    res.json({ ok: true, message: 'Delivery queued for retry' });
  })
);

export default router;