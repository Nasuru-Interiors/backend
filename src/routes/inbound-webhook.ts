import { Router, Request, Response, NextFunction } from 'express';
import { sql } from '../lib/db';
import { verifySignature, parseSignatureHeader } from '../lib/webhook';
import { slugify, estimateReadingMinutes } from '../lib/slug';
import { sanitizeRichText } from '../lib/sanitize';

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/**
 * Inbound webhook endpoint for external systems to create/update articles.
 * 
 * Security: HMAC-SHA256 signature verification
 * Headers required:
 *   X-Webhook-Signature: sha256=<hex>
 *   X-Webhook-Timestamp: unix timestamp
 *   X-Webhook-Source: identifier for the source system
 * 
 * Body: Article data matching articleSchema
 */

// Get webhook endpoint by inbound URL path
async function getWebhookByInboundUrl(path: string): Promise<{ secret: string; is_inbound: boolean } | null> {
  const rows = await sql`
    SELECT secret, is_inbound FROM public.webhook_endpoints
    WHERE inbound_url = ${path} AND is_inbound = TRUE
    LIMIT 1
  `;
  if (rows.length) return { secret: rows[0].secret as string, is_inbound: rows[0].is_inbound as boolean };
  return null;
}

// Verify webhook signature using inbound URL path
async function verifyWebhookRequest(req: Request): Promise<{ valid: boolean; error?: string }> {
  const signature = parseSignatureHeader(req.headers['x-webhook-signature'] as string);
  const timestamp = req.headers['x-webhook-timestamp'] as string;

  if (!signature) {
    return { valid: false, error: 'Missing X-Webhook-Signature header' };
  }

  if (!timestamp) {
    return { valid: false, error: 'Missing X-Webhook-Timestamp header' };
  }

  // Check timestamp freshness (5 min window)
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) {
    return { valid: false, error: 'Invalid or expired timestamp' };
  }

  // Get the inbound URL path from the request
  const inboundPath = req.path; // e.g., /api/public/webhook/inbound/abc123
  const webhook = await getWebhookByInboundUrl(inboundPath);
  
  if (!webhook) {
    return { valid: false, error: 'Invalid inbound webhook URL' };
  }

  if (!webhook.is_inbound) {
    return { valid: false, error: 'Endpoint is not configured for inbound webhooks' };
  }

  // Include timestamp in signed payload to prevent replay
  const payload = `${timestamp}.${JSON.stringify(req.body)}`;
  const valid = verifySignature(payload, signature, webhook.secret);

  return { valid, error: valid ? undefined : 'Invalid signature' };
}

async function setArticleCategories(articleId: string, categoryIds: string[]) {
  await sql`DELETE FROM public.article_categories WHERE article_id = ${articleId}`;
  if (categoryIds.length) {
    for (const catId of categoryIds) {
      await sql`
        INSERT INTO public.article_categories (article_id, category_id)
        VALUES (${articleId}, ${catId})
      `;
    }
  }
}

// POST /api/public/webhook/article - Create or update article from external system
router.post(
  '/article',
  wrap(async (req, res) => {
    const verification = await verifyWebhookRequest(req);
    if (!verification.valid) {
      res.status(401).json({ error: verification.error });
      return;
    }

    const body = req.body;

    // Validate required fields
    if (!body.title || typeof body.title !== 'string') {
      res.status(400).json({ error: 'title is required' });
      return;
    }

    const slug = slugify(body.slug || body.title);
    const content = sanitizeRichText(body.content_html || '');
    const status = body.status === 'published' ? 'published' : 'draft';
    const publishedAt = status === 'published' ? new Date().toISOString() : null;
    const readingMinutes = estimateReadingMinutes(content);

    // Check if article exists by slug (upsert behavior)
    const existingRows = await sql`
      SELECT id, status FROM public.articles WHERE slug = ${slug} LIMIT 1
    `;

    let articleId: string;
    let isNew = false;

    if (existingRows.length) {
      // Update existing
      const existing = existingRows[0];
      articleId = String(existing.id);

      const becomingPublished = status === 'published' && existing.status !== 'published';
      const finalPublishedAt = becomingPublished ? new Date().toISOString() : (status === 'published' ? existing.published_at : null);

      await sql`
        UPDATE public.articles SET
          title = ${body.title},
          slug = ${slug},
          excerpt = ${body.excerpt ?? ''},
          content_html = ${content},
          cover_image_url = ${body.cover_image_url ?? null},
          cover_public_id = ${body.cover_public_id ?? null},
          meta_title = ${body.meta_title ?? ''},
          meta_description = ${body.meta_description ?? ''},
          keywords = ${body.keywords ?? []},
          status = ${status},
          featured = ${body.featured ?? false},
          author = ${body.author ?? 'External System'},
          reading_minutes = ${readingMinutes},
          published_at = ${finalPublishedAt},
          updated_at = NOW()
        WHERE id = ${articleId}
      `;
    } else {
      // Create new
      isNew = true;
      const inserted = await sql`
        INSERT INTO public.articles (
          title, slug, excerpt, content_html, cover_image_url, cover_public_id,
          meta_title, meta_description, keywords, status, featured, author,
          reading_minutes, published_at
        ) VALUES (
          ${body.title}, ${slug}, ${body.excerpt ?? ''}, ${content}, ${body.cover_image_url ?? null},
          ${body.cover_public_id ?? null}, ${body.meta_title ?? ''}, ${body.meta_description ?? ''},
          ${body.keywords ?? []}, ${status}, ${body.featured ?? false}, ${body.author ?? 'External System'},
          ${readingMinutes}, ${publishedAt}
        )
        RETURNING id
      `;
      articleId = String(inserted[0].id);
    }

    // Handle categories
    await setArticleCategories(articleId, body.category_ids || []);

    // Return created/updated article
    const result = await sql`
      SELECT a.*, 
        COALESCE(
          json_agg(json_build_object('category_id', ac.category_id)) FILTER (WHERE ac.category_id IS NOT NULL),
          '[]'
        ) as article_categories
      FROM public.articles a
      LEFT JOIN public.article_categories ac ON ac.article_id = a.id
      WHERE a.id = ${articleId}
      GROUP BY a.id
    `;

    res.status(isNew ? 201 : 200).json({
      ...result[0],
      article_categories: result[0].article_categories || [],
    });
  })
);

// GET /api/public/webhook/article/:slug - Get article by slug (for verification)
router.get(
  '/article/:slug',
  wrap(async (req, res) => {
    const verification = await verifyWebhookRequest(req);
    if (!verification.valid) {
      res.status(401).json({ error: verification.error });
      return;
    }

    const rows = await sql`
      SELECT a.*, 
        COALESCE(
          json_agg(json_build_object('category_id', ac.category_id)) FILTER (WHERE ac.category_id IS NOT NULL),
          '[]'
        ) as article_categories
      FROM public.articles a
      LEFT JOIN public.article_categories ac ON ac.article_id = a.id
      WHERE a.slug = ${req.params.slug}
      GROUP BY a.id
    `;

    if (!rows.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    res.json({
      ...rows[0],
      article_categories: rows[0].article_categories || [],
    });
  })
);

// DELETE /api/public/webhook/article/:slug - Delete article by slug
router.delete(
  '/article/:slug',
  wrap(async (req, res) => {
    const verification = await verifyWebhookRequest(req);
    if (!verification.valid) {
      res.status(401).json({ error: verification.error });
      return;
    }

    const existingRows = await sql`
      SELECT id, cover_public_id FROM public.articles WHERE slug = ${req.params.slug} LIMIT 1
    `;

    if (!existingRows.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }

    const existing = existingRows[0];
    if (existing.cover_public_id) {
      const { destroyAsset } = await import('../lib/cloudinary');
      await destroyAsset(String(existing.cover_public_id));
    }

    await sql`DELETE FROM public.articles WHERE slug = ${req.params.slug}`;
    res.json({ ok: true });
  })
);

export default router;