import { Router, Request, Response, NextFunction } from 'express';
import { sql } from '../lib/db';

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// GET /api/public/site-settings
router.get(
  '/site-settings',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.site_settings WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/hero
router.get(
  '/hero',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.hero_settings WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/about
router.get(
  '/about',
  wrap(async (_req, res) => {
    const rows = await sql`SELECT * FROM public.about_content WHERE id = 1`;
    res.json(rows[0] || {});
  }),
);

// GET /api/public/carousel
router.get(
  '/carousel',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT * FROM public.carousel_images
      WHERE active = true
      ORDER BY sort_order ASC
    `;
    res.json(rows);
  }),
);

// GET /api/public/categories
router.get(
  '/categories',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT * FROM public.categories
      ORDER BY name ASC
    `;
    res.json(rows);
  }),
);

// GET /api/public/articles?page=1&limit=9&category=slug&featured=true
router.get(
  '/articles',
  wrap(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '9'), 10)));
    const offset = (page - 1) * limit;

    const empty = { items: [], page, limit, total: 0, totalPages: 0 };
    const featuredOnly = req.query.featured === 'true';

    let categoryArticleIds: string[] | null = null;

    if (req.query.category) {
      const catRows = await sql`
        SELECT id FROM public.categories WHERE slug = ${String(req.query.category)} LIMIT 1
      `;
      if (!catRows.length) {
        res.json(empty);
        return;
      }
      const linkRows = await sql`
        SELECT article_id FROM public.article_categories WHERE category_id = ${catRows[0].id}
      `;
      categoryArticleIds = linkRows.map((r) => String(r.article_id));
      if (!categoryArticleIds.length) {
        res.json(empty);
        return;
      }
    }

    let countRows;
    let itemRows;

    if (categoryArticleIds !== null && featuredOnly) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND featured = true AND id = ANY(${categoryArticleIds})
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND featured = true AND id = ANY(${categoryArticleIds})
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (categoryArticleIds !== null) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND id = ANY(${categoryArticleIds})
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND id = ANY(${categoryArticleIds})
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else if (featuredOnly) {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published' AND featured = true
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published' AND featured = true
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    } else {
      countRows = await sql`
        SELECT count(*)::int as count FROM public.articles
        WHERE status = 'published'
      `;
      itemRows = await sql`
        SELECT id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords
        FROM public.articles
        WHERE status = 'published'
        ORDER BY published_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `;
    }

    const total = countRows[0]?.count ?? 0;

    res.json({
      items: itemRows ?? [],
      page,
      limit,
      total,
      totalPages: total ? Math.ceil(total / limit) : 0,
    });
  }),
);

// GET /api/public/articles/:slug
router.get(
  '/articles/:slug',
  wrap(async (req, res) => {
    const rows = await sql`
      SELECT * FROM public.articles
      WHERE slug = ${req.params.slug} AND status = 'published'
      LIMIT 1
    `;

    if (!rows.length) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(rows[0]);
  }),
);

// GET /api/public/articles/:slug/related
router.get(
  '/articles/:slug/related',
  wrap(async (req, res) => {
    const rows = await sql`
      SELECT id, slug, title, excerpt, cover_image_url, published_at, reading_minutes
      FROM public.articles
      WHERE status = 'published' AND slug != ${req.params.slug}
      ORDER BY published_at DESC
      LIMIT 3
    `;
    res.json(rows ?? []);
  }),
);

// GET /api/public/sitemap-articles — slugs + updated dates for the sitemap
router.get(
  '/sitemap-articles',
  wrap(async (_req, res) => {
    const rows = await sql`
      SELECT slug, updated_at, published_at
      FROM public.articles
      WHERE status = 'published'
      ORDER BY published_at DESC
    `;
    res.json(rows ?? []);
  }),
);

export default router;
