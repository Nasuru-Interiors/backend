import { Router, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase';
import { buildUploadSignature, destroyAsset } from '../lib/cloudinary';
import { requireAdmin, AuthedRequest } from '../middleware/auth';
import { slugify, estimateReadingMinutes } from '../lib/slug';
import { sanitizeRichText } from '../lib/sanitize';
import { mediaLimiter } from '../middleware/rateLimit';
import {
  articleSchema,
  heroSchema,
  siteSettingsSchema,
  carouselSchema,
  carouselUpdateSchema,
  reorderSchema,
  aboutSchema,
  categorySchema,
  mediaSignSchema,
  mediaDestroySchema,
} from '../validation/schemas';

const router = Router();
router.use(requireAdmin);

const wrap =
  (fn: (req: AuthedRequest, res: Response) => Promise<void>) =>
  (req: AuthedRequest, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

// ---------------------------------------------------------------------
// Media (Cloudinary)
// ---------------------------------------------------------------------
router.post(
  '/media/sign',
  mediaLimiter,
  wrap(async (req, res) => {
    const { folder } = mediaSignSchema.parse(req.body);
    res.json(buildUploadSignature(folder));
  }),
);

router.delete(
  '/media',
  wrap(async (req, res) => {
    const { public_id } = mediaDestroySchema.parse(req.body);
    await destroyAsset(public_id);
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// Dashboard stats
// ---------------------------------------------------------------------
router.get(
  '/stats',
  wrap(async (_req, res) => {
    const [articles, published, carousel, categories] = await Promise.all([
      supabaseAdmin.from('articles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabaseAdmin.from('carousel_images').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('categories').select('id', { count: 'exact', head: true }),
    ]);
    res.json({
      articles: articles.count ?? 0,
      published: published.count ?? 0,
      drafts: (articles.count ?? 0) - (published.count ?? 0),
      carousel: carousel.count ?? 0,
      categories: categories.count ?? 0,
    });
  }),
);

// ---------------------------------------------------------------------
// Articles CRUD
// ---------------------------------------------------------------------
router.get(
  '/articles',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('id, slug, title, status, featured, published_at, updated_at, cover_image_url')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    res.json(data ?? []);
  }),
);

router.get(
  '/articles/:id',
  wrap(async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*, article_categories(category_id)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json(data);
  }),
);

async function setArticleCategories(articleId: string, categoryIds: string[]) {
  await supabaseAdmin.from('article_categories').delete().eq('article_id', articleId);
  if (categoryIds.length) {
    await supabaseAdmin
      .from('article_categories')
      .insert(categoryIds.map((category_id) => ({ article_id: articleId, category_id })));
  }
}

router.post(
  '/articles',
  wrap(async (req, res) => {
    const body = articleSchema.parse(req.body);
    const slug = slugify(body.slug || body.title);
    const content = sanitizeRichText(body.content_html);

    const row = {
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content_html: content,
      cover_image_url: body.cover_image_url ?? null,
      cover_public_id: body.cover_public_id ?? null,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      keywords: body.keywords,
      status: body.status,
      featured: body.featured,
      author: body.author || 'First Choice Roofing Services',
      reading_minutes: estimateReadingMinutes(content),
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabaseAdmin.from('articles').insert(row).select().single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    await setArticleCategories(data.id, body.category_ids);
    res.status(201).json(data);
  }),
);

router.put(
  '/articles/:id',
  wrap(async (req, res) => {
    const body = articleSchema.parse(req.body);

    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('status, published_at')
      .eq('id', req.params.id)
      .single();

    const slug = slugify(body.slug || body.title);
    const content = sanitizeRichText(body.content_html);
    const becomingPublished = body.status === 'published';
    const published_at =
      becomingPublished && !existing?.published_at ? new Date().toISOString() : existing?.published_at ?? null;

    const row = {
      title: body.title,
      slug,
      excerpt: body.excerpt,
      content_html: content,
      cover_image_url: body.cover_image_url ?? null,
      cover_public_id: body.cover_public_id ?? null,
      meta_title: body.meta_title,
      meta_description: body.meta_description,
      keywords: body.keywords,
      status: body.status,
      featured: body.featured,
      author: body.author || 'First Choice Roofing Services',
      reading_minutes: estimateReadingMinutes(content),
      published_at: becomingPublished ? published_at : null,
    };

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(row)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    await setArticleCategories(data.id, body.category_ids);
    res.json(data);
  }),
);

router.delete(
  '/articles/:id',
  wrap(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('articles')
      .select('cover_public_id')
      .eq('id', req.params.id)
      .single();
    if (existing?.cover_public_id) await destroyAsset(existing.cover_public_id);

    const { error } = await supabaseAdmin.from('articles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// Hero
// ---------------------------------------------------------------------
router.get(
  '/hero',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('hero_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

router.put(
  '/hero',
  wrap(async (req, res) => {
    const body = heroSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('hero_settings')
      .update({ ...body, image_url: body.image_url ?? null, image_public_id: body.image_public_id ?? null })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  }),
);

// ---------------------------------------------------------------------
// Site settings (appearance + business + SEO)
// ---------------------------------------------------------------------
router.get(
  '/site-settings',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('site_settings').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

router.put(
  '/site-settings',
  wrap(async (req, res) => {
    const body = siteSettingsSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .update(body)
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  }),
);

// ---------------------------------------------------------------------
// About content
// ---------------------------------------------------------------------
router.get(
  '/about',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin.from('about_content').select('*').eq('id', 1).single();
    if (error) throw error;
    res.json(data);
  }),
);

router.put(
  '/about',
  wrap(async (req, res) => {
    const body = aboutSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('about_content')
      .update({
        ...body,
        body_html: sanitizeRichText(body.body_html),
        image_url: body.image_url ?? null,
        image_public_id: body.image_public_id ?? null,
      })
      .eq('id', 1)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  }),
);

// ---------------------------------------------------------------------
// Carousel
// ---------------------------------------------------------------------
router.get(
  '/carousel',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('carousel_images')
      .select('*')
      .order('sort_order', { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  }),
);

router.post(
  '/carousel',
  wrap(async (req, res) => {
    const body = carouselSchema.parse(req.body);
    const { data, error } = await supabaseAdmin.from('carousel_images').insert(body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  }),
);

router.put(
  '/carousel/:id',
  wrap(async (req, res) => {
    const body = carouselUpdateSchema.parse(req.body);
    const { data, error } = await supabaseAdmin
      .from('carousel_images')
      .update(body)
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  }),
);

router.put(
  '/carousel-reorder',
  wrap(async (req, res) => {
    const { ids } = reorderSchema.parse(req.body);
    await Promise.all(
      ids.map((id, index) =>
        supabaseAdmin.from('carousel_images').update({ sort_order: index }).eq('id', id),
      ),
    );
    res.json({ ok: true });
  }),
);

router.delete(
  '/carousel/:id',
  wrap(async (req, res) => {
    const { data: existing } = await supabaseAdmin
      .from('carousel_images')
      .select('public_id')
      .eq('id', req.params.id)
      .single();
    if (existing?.public_id) await destroyAsset(existing.public_id);

    const { error } = await supabaseAdmin.from('carousel_images').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  }),
);

// ---------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------
router.get(
  '/categories',
  wrap(async (_req, res) => {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    res.json(data ?? []);
  }),
);

router.post(
  '/categories',
  wrap(async (req, res) => {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.slug || body.name);
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert({ ...body, slug })
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.status(201).json(data);
  }),
);

router.put(
  '/categories/:id',
  wrap(async (req, res) => {
    const body = categorySchema.parse(req.body);
    const slug = slugify(body.slug || body.name);
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update({ ...body, slug })
      .eq('id', req.params.id)
      .select()
      .single();
    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }
    res.json(data);
  }),
);

router.delete(
  '/categories/:id',
  wrap(async (req, res) => {
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ ok: true });
  }),
);

export default router;
