import { Router, Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';

const router = Router();

const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// GET /api/public/site-settings
router.get(
  '/site-settings',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('site_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

// GET /api/public/hero
router.get(
  '/hero',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('hero_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

// GET /api/public/about
router.get(
  '/about',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('about_content').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

// GET /api/public/carousel
router.get(
  '/carousel',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('carousel_images')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data);
  }),
);

// GET /api/public/categories
router.get(
  '/categories',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data);
  }),
);

// GET /api/public/articles?page=1&limit=9&category=slug&featured=true
router.get(
  '/articles',
  wrap(async (req, res) => {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit || '9'), 10)));
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabaseAdmin
      .from('articles')
      .select(
        'id, slug, title, excerpt, cover_image_url, author, reading_minutes, published_at, featured, keywords',
        { count: 'exact' },
      )
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (req.query.featured === 'true') query = query.eq('featured', true);

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    res.json({
      items: data ?? [],
      page,
      limit,
      total: count ?? 0,
      totalPages: count ? Math.ceil(count / limit) : 0,
    });
  }),
);

// GET /api/public/articles/:slug
router.get(
  '/articles/:slug',
  wrap(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('slug', req.params.slug)
      .eq('status', 'published')
      .single();

    if (error || !data) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(data);
  }),
);

// GET /api/public/articles/:slug/related
router.get(
  '/articles/:slug/related',
  wrap(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, slug, title, excerpt, cover_image_url, published_at, reading_minutes')
      .eq('status', 'published')
      .neq('slug', req.params.slug)
      .order('published_at', { ascending: false })
      .limit(3);
    if (error) throw error;
    res.json(data ?? []);
  }),
);

// GET /api/public/sitemap-articles — slugs + updated dates for the sitemap
router.get(
  '/sitemap-articles',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  }),
);

export default router;
