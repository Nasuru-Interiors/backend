import { z } from 'zod';

const hex = z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a hex color');

export const articleSchema = z.object({
  title: z.string().min(1).max(200),
  slug: z.string().max(80).optional(),
  excerpt: z.string().max(500).optional().default(''),
  content_html: z.string().optional().default(''),
  cover_image_url: z.string().url().nullable().optional(),
  cover_public_id: z.string().nullable().optional(),
  meta_title: z.string().max(200).optional().default(''),
  meta_description: z.string().max(320).optional().default(''),
  keywords: z.array(z.string()).optional().default([]),
  status: z.enum(['draft', 'published']).optional().default('draft'),
  featured: z.boolean().optional().default(false),
  author: z.string().max(120).optional(),
  category_ids: z.array(z.string().uuid()).optional().default([]),
});

export const heroSchema = z.object({
  heading: z.string().min(1).max(200),
  subheading: z.string().max(500).optional().default(''),
  cta_label: z.string().max(60).optional().default(''),
  cta_href: z.string().max(200).optional().default(''),
  secondary_cta_label: z.string().max(60).optional().default(''),
  secondary_cta_href: z.string().max(200).optional().default(''),
  background_type: z.enum(['image', 'color']),
  background_color: hex,
  text_color: hex,
  overlay_opacity: z.number().min(0).max(1),
  image_url: z.string().url().nullable().optional(),
  image_public_id: z.string().nullable().optional(),
});

export const siteSettingsSchema = z.object({
  business_name: z.string().min(1).max(200),
  tagline: z.string().max(300).optional(),
  logo_url: z.string().url().nullable().optional(),
  logo_public_id: z.string().nullable().optional(),
  primary_color: hex,
  secondary_color: hex,
  default_hero_color: hex,
  phone: z.string().max(40).optional(),
  whatsapp: z.string().max(40).optional(),
  email: z.string().max(200).optional(),
  address: z.string().max(300).optional(),
  city: z.string().max(120).optional(),
  state: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  facebook_url: z.string().max(300).optional(),
  instagram_url: z.string().max(300).optional(),
  twitter_url: z.string().max(300).optional(),
  linkedin_url: z.string().max(300).optional(),
  default_meta_title: z.string().max(200).optional(),
  default_meta_description: z.string().max(320).optional(),
});

export const carouselSchema = z.object({
  image_url: z.string().url(),
  public_id: z.string().optional(),
  alt: z.string().max(200).optional().default(''),
  caption: z.string().max(300).optional().default(''),
  sort_order: z.number().int().optional().default(0),
  active: z.boolean().optional().default(true),
});

export const carouselUpdateSchema = carouselSchema.partial();

export const reorderSchema = z.object({
  ids: z.array(z.string().uuid()),
});

export const aboutSchema = z.object({
  headline: z.string().min(1).max(200),
  subheading: z.string().max(300).optional().default(''),
  body_html: z.string().optional().default(''),
  image_url: z.string().url().nullable().optional(),
  image_public_id: z.string().nullable().optional(),
  stats: z.array(z.object({ label: z.string(), value: z.string() })).optional().default([]),
  team: z
    .array(z.object({ name: z.string(), role: z.string(), image_url: z.string().optional() }))
    .optional()
    .default([]),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(120),
  slug: z.string().max(120).optional(),
  description: z.string().max(300).optional().default(''),
});

export const mediaSignSchema = z.object({
  folder: z.string().max(60).optional(),
});

export const mediaDestroySchema = z.object({
  public_id: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
