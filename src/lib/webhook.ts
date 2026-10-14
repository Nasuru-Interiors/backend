import { createHmac, timingSafeEqual } from 'crypto';
import { sql } from './db';
import { logger } from './logger';

/**
 * Generate a secure webhook secret
 */
export function generateWebhookSecret(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Compute HMAC-SHA256 signature for payload
 */
export function computeSignature(payload: string | Buffer, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify HMAC signature using timing-safe comparison
 */
export function verifySignature(payload: string | Buffer, signature: string, secret: string): boolean {
  const expected = computeSignature(payload, secret);
  // timingSafeEqual requires same length buffers
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

/**
 * Parse signature from header (format: "sha256=<hex>")
 */
export function parseSignatureHeader(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^sha256=([a-f0-9]+)$/i);
  return match ? match[1] : null;
}

/**
 * Webhook event types
 */
export const WEBHOOK_EVENTS = [
  'article.created',
  'article.updated',
  'article.published',
  'article.unpublished',
  'article.deleted',
] as const;

export type WebhookEventType = typeof WEBHOOK_EVENTS[number];

/**
 * Check if an endpoint should receive an event
 */
export function shouldDeliverEvent(endpointEvents: string[], eventType: string): boolean {
  for (const pattern of endpointEvents) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;
    if (pattern.endsWith('.*')) {
      const prefix = pattern.slice(0, -2);
      if (eventType.startsWith(prefix + '.')) return true;
    }
  }
  return false;
}

/**
 * Create a webhook delivery record
 */
export async function createDeliveryRecord(
  endpointId: string,
  eventType: string,
  payload: unknown,
  maxAttempts = 5
): Promise<string> {
  const result = await sql`
    INSERT INTO public.webhook_deliveries (
      endpoint_id, event_type, payload, max_attempts, next_retry_at
    ) VALUES (
      ${endpointId}, ${eventType}, ${JSON.stringify(payload)}, ${maxAttempts}, NOW()
    )
    RETURNING id
  `;
  return result[0].id as string;
}

/**
 * Update delivery record after attempt
 */
export async function updateDeliveryRecord(
  deliveryId: string,
  opts: {
    responseStatus?: number;
    responseBody?: string;
    responseHeaders?: Record<string, string>;
    errorMessage?: string;
    success?: boolean;
    attempt?: number;
    maxAttempts?: number;
  }
): Promise<void> {
  const { responseStatus, responseBody, responseHeaders, errorMessage, success, attempt, maxAttempts } = opts;

  if (success) {
    await sql`
      UPDATE public.webhook_deliveries
      SET
        response_status = ${responseStatus ?? null},
        response_body = ${responseBody ?? null},
        response_headers = ${responseHeaders ? JSON.stringify(responseHeaders) : null},
        delivered_at = NOW(),
        attempt = ${attempt ?? 1}
      WHERE id = ${deliveryId}
    `;
  } else {
    const nextRetryAt = new Date();
    // Exponential backoff: 1min, 5min, 15min, 1hr, 6hr
    const backoffMinutes = [1, 5, 15, 60, 360];
    const attemptNum = attempt ?? 1;
    const delayMinutes = backoffMinutes[Math.min(attemptNum - 1, backoffMinutes.length - 1)];
    nextRetryAt.setMinutes(nextRetryAt.getMinutes() + delayMinutes);

    if (attemptNum >= (maxAttempts ?? 5)) {
      await sql`
        UPDATE public.webhook_deliveries
        SET
          response_status = ${responseStatus ?? null},
          response_body = ${responseBody ?? null},
          response_headers = ${responseHeaders ? JSON.stringify(responseHeaders) : null},
          error_message = ${errorMessage ?? 'Max retries exceeded'},
          failed_at = NOW(),
          attempt = ${attemptNum}
        WHERE id = ${deliveryId}
      `;
    } else {
      await sql`
        UPDATE public.webhook_deliveries
        SET
          response_status = ${responseStatus ?? null},
          response_body = ${responseBody ?? null},
          response_headers = ${responseHeaders ? JSON.stringify(responseHeaders) : null},
          error_message = ${errorMessage ?? null},
          attempt = ${attemptNum},
          next_retry_at = ${nextRetryAt.toISOString()}
        WHERE id = ${deliveryId}
      `;
    }
  }
}

/**
 * Get pending deliveries ready for retry
 */
export async function getPendingDeliveries(limit = 50): Promise<Array<{
  id: string;
  endpoint_id: string;
  event_type: string;
  payload: unknown;
  attempt: number;
  max_attempts: number;
  url: string;
  secret: string;
}>> {
  const rows = await sql`
    SELECT
      d.id,
      d.endpoint_id,
      d.event_type,
      d.payload,
      d.attempt,
      d.max_attempts,
      e.url,
      e.secret
    FROM public.webhook_deliveries d
    JOIN public.webhook_endpoints e ON e.id = d.endpoint_id
    WHERE e.active = TRUE
      AND d.delivered_at IS NULL
      AND d.failed_at IS NULL
      AND d.attempt < d.max_attempts
      AND (d.next_retry_at IS NULL OR d.next_retry_at <= NOW())
    ORDER BY d.created_at ASC
    LIMIT ${limit}
  `;
  return rows as Array<{
    id: string;
    endpoint_id: string;
    event_type: string;
    payload: unknown;
    attempt: number;
    max_attempts: number;
    url: string;
    secret: string;
  }>;
}

/**
 * Deliver a webhook payload to an endpoint
 */
export async function deliverWebhook(
  url: string,
  secret: string,
  eventType: string,
  payload: unknown,
  deliveryId: string,
  attempt: number,
  maxAttempts: number
): Promise<{ success: boolean; status?: number; body?: string; headers?: Record<string, string>; error?: string }> {
  const payloadString = JSON.stringify(payload);
  const signature = computeSignature(payloadString, secret);
  const timestamp = Math.floor(Date.now() / 1000).toString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': eventType,
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Delivery': deliveryId,
        'User-Agent': 'Nasuru-Interiors-Webhook/1.0',
      },
      body: payloadString,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    const responseBody = await response.text();

    if (response.ok) {
      return { success: true, status: response.status, body: responseBody, headers: responseHeaders };
    } else {
      return {
        success: false,
        status: response.status,
        body: responseBody,
        headers: responseHeaders,
        error: `HTTP ${response.status}: ${responseBody.slice(0, 200)}`,
      };
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Process a single delivery
 */
export async function processDelivery(
  delivery: {
    id: string;
    endpoint_id: string;
    event_type: string;
    payload: unknown;
    attempt: number;
    max_attempts: number;
    url: string;
    secret: string;
  }
): Promise<void> {
  const result = await deliverWebhook(
    delivery.url,
    delivery.secret,
    delivery.event_type,
    delivery.payload,
    delivery.id,
    delivery.attempt,
    delivery.max_attempts
  );

  await updateDeliveryRecord(delivery.id, {
    responseStatus: result.status,
    responseBody: result.body,
    responseHeaders: result.headers,
    errorMessage: result.error,
    success: result.success,
    attempt: delivery.attempt,
    maxAttempts: delivery.max_attempts,
  });

  if (result.success) {
    logger.info('Webhook delivered', { deliveryId: delivery.id, eventType: delivery.event_type, endpointId: delivery.endpoint_id });
  } else {
    logger.warn('Webhook delivery failed', {
      deliveryId: delivery.id,
      eventType: delivery.event_type,
      endpointId: delivery.endpoint_id,
      attempt: delivery.attempt,
      error: result.error,
    });
  }
}

/**
 * Process all pending deliveries (call from cron/job queue)
 */
export async function processPendingDeliveries(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const deliveries = await getPendingDeliveries();
  let succeeded = 0;
  let failed = 0;

  for (const delivery of deliveries) {
    try {
      await processDelivery(delivery);
      if (delivery.attempt === 1) succeeded++;
    } catch (err) {
      failed++;
      logger.error('Error processing delivery', { deliveryId: delivery.id, error: err });
    }
  }

  return { processed: deliveries.length, succeeded, failed };
}

/**
 * Trigger webhooks for an event (fire-and-forget, creates delivery records)
 */
export async function triggerWebhooks(
  eventType: WebhookEventType,
  payload: unknown
): Promise<number> {
  const endpoints = await sql`
    SELECT id, url, secret, events
    FROM public.webhook_endpoints
    WHERE active = TRUE
  `;

  let triggered = 0;
  for (const endpoint of endpoints) {
    if (shouldDeliverEvent(endpoint.events as string[], eventType)) {
      await createDeliveryRecord(endpoint.id as string, eventType, payload);
      triggered++;
    }
  }

  logger.info('Webhooks triggered', { eventType, triggered });
  return triggered;
}