import { sql } from '../lib/db';

async function fetchFromSupabase(supabaseUrl: string, serviceKey: string, table: string): Promise<any[]> {
  const url = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch ${table} from Supabase: ${res.status} ${res.statusText} - ${text}`);
  }

  return (await res.json()) as any[];
}

async function main() {
  const args = process.argv.slice(2);
  const supabaseUrl =
    args[0] || process.env.SUPABASE_URL || 'https://bbdsjtamezbdefdegnyt.supabase.co';
  const serviceKey =
    args[1] ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZHNqdGFtZXpiZGVmZGVnbnl0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MjUzMjcxMywiZXhwIjoyMDk4MTA4NzEzfQ.VmpR111uwo4R3xB5jgNmEkCHHXR7MwwM-WjfDspqFvM';

  console.log('🚀 Migrating data from Supabase to Neon Database...');
  console.log(`Supabase URL: ${supabaseUrl}`);

  // 1. site_settings
  try {
    const siteSettings = await fetchFromSupabase(supabaseUrl, serviceKey, 'site_settings');
    if (siteSettings.length > 0) {
      const r = siteSettings[0];
      await sql`
        UPDATE public.site_settings SET
          business_name = ${r.business_name ?? 'Nasuru Interiors'},
          tagline = ${r.tagline ?? ''},
          logo_url = ${r.logo_url ?? null},
          logo_public_id = ${r.logo_public_id ?? null},
          primary_color = ${r.primary_color ?? '#2F5D8C'},
          secondary_color = ${r.secondary_color ?? '#FFFFFF'},
          default_hero_color = ${r.default_hero_color ?? '#2F5D8C'},
          phone = ${r.phone ?? ''},
          whatsapp = ${r.whatsapp ?? ''},
          email = ${r.email ?? ''},
          address = ${r.address ?? ''},
          city = ${r.city ?? ''},
          state = ${r.state ?? ''},
          country = ${r.country ?? ''},
          lat = ${r.lat ?? null},
          lng = ${r.lng ?? null},
          facebook_url = ${r.facebook_url ?? ''},
          instagram_url = ${r.instagram_url ?? ''},
          twitter_url = ${r.twitter_url ?? ''},
          linkedin_url = ${r.linkedin_url ?? ''},
          default_meta_title = ${r.default_meta_title ?? ''},
          default_meta_description = ${r.default_meta_description ?? ''}
        WHERE id = 1
      `;
      console.log('✅ Migrated site_settings');
    }
  } catch (e: any) {
    console.warn('⚠️ Could not migrate site_settings:', e.message);
  }

  // 2. hero_settings
  try {
    const heroSettings = await fetchFromSupabase(supabaseUrl, serviceKey, 'hero_settings');
    if (heroSettings.length > 0) {
      const r = heroSettings[0];
      await sql`
        UPDATE public.hero_settings SET
          heading = ${r.heading ?? ''},
          subheading = ${r.subheading ?? ''},
          cta_label = ${r.cta_label ?? ''},
          cta_href = ${r.cta_href ?? ''},
          secondary_cta_label = ${r.secondary_cta_label ?? ''},
          secondary_cta_href = ${r.secondary_cta_href ?? ''},
          background_type = ${r.background_type ?? 'color'},
          background_color = ${r.background_color ?? '#2F5D8C'},
          text_color = ${r.text_color ?? '#FFFFFF'},
          overlay_opacity = ${r.overlay_opacity ?? 0.45},
          image_url = ${r.image_url ?? null},
          image_public_id = ${r.image_public_id ?? null}
        WHERE id = 1
      `;
      console.log('✅ Migrated hero_settings');
    }
  } catch (e: any) {
    console.warn('⚠️ Could not migrate hero_settings:', e.message);
  }

  // 3. about_content
  try {
    const aboutContent = await fetchFromSupabase(supabaseUrl, serviceKey, 'about_content');
    if (aboutContent.length > 0) {
      const r = aboutContent[0];
      await sql`
        UPDATE public.about_content SET
          headline = ${r.headline ?? ''},
          subheading = ${r.subheading ?? ''},
          body_html = ${r.body_html ?? ''},
          image_url = ${r.image_url ?? null},
          image_public_id = ${r.image_public_id ?? null},
          stats = ${JSON.stringify(r.stats ?? [])}::jsonb,
          team = ${JSON.stringify(r.team ?? [])}::jsonb
        WHERE id = 1
      `;
      console.log('✅ Migrated about_content');
    }
  } catch (e: any) {
    console.warn('⚠️ Could not migrate about_content:', e.message);
  }

  // 4. categories
  try {
    const categories = await fetchFromSupabase(supabaseUrl, serviceKey, 'categories');
    for (const r of categories) {
      await sql`
        INSERT INTO public.categories (id, name, slug, description, created_at)
        VALUES (${r.id}, ${r.name}, ${r.slug}, ${r.description ?? ''}, ${r.created_at})
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description
      `;
    }
    console.log(`✅ Migrated ${categories.length} categories`);
  } catch (e: any) {
    console.warn('⚠️ Could not migrate categories:', e.message);
  }

  // 5. articles
  try {
    const articles = await fetchFromSupabase(supabaseUrl, serviceKey, 'articles');
    for (const r of articles) {
      await sql`
        INSERT INTO public.articles (
          id, slug, title, excerpt, content_html, cover_image_url, cover_public_id,
          meta_title, meta_description, keywords, status, featured, author,
          reading_minutes, published_at, created_at, updated_at
        ) VALUES (
          ${r.id}, ${r.slug}, ${r.title}, ${r.excerpt ?? ''}, ${r.content_html ?? ''},
          ${r.cover_image_url ?? null}, ${r.cover_public_id ?? null}, ${r.meta_title ?? ''},
          ${r.meta_description ?? ''}, ${r.keywords ?? []}, ${r.status ?? 'draft'},
          ${r.featured ?? false}, ${r.author ?? 'Nasuru Interiors'},
          ${r.reading_minutes ?? 3}, ${r.published_at ?? null},
          ${r.created_at ?? new Date().toISOString()}, ${r.updated_at ?? new Date().toISOString()}
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug,
          title = EXCLUDED.title,
          excerpt = EXCLUDED.excerpt,
          content_html = EXCLUDED.content_html,
          cover_image_url = EXCLUDED.cover_image_url,
          cover_public_id = EXCLUDED.cover_public_id,
          meta_title = EXCLUDED.meta_title,
          meta_description = EXCLUDED.meta_description,
          keywords = EXCLUDED.keywords,
          status = EXCLUDED.status,
          featured = EXCLUDED.featured,
          author = EXCLUDED.author,
          reading_minutes = EXCLUDED.reading_minutes,
          published_at = EXCLUDED.published_at,
          updated_at = EXCLUDED.updated_at
      `;
    }
    console.log(`✅ Migrated ${articles.length} articles`);
  } catch (e: any) {
    console.warn('⚠️ Could not migrate articles:', e.message);
  }

  // 6. article_categories
  try {
    const articleCategories = await fetchFromSupabase(supabaseUrl, serviceKey, 'article_categories');
    for (const r of articleCategories) {
      await sql`
        INSERT INTO public.article_categories (article_id, category_id)
        VALUES (${r.article_id}, ${r.category_id})
        ON CONFLICT (article_id, category_id) DO NOTHING
      `;
    }
    console.log(`✅ Migrated ${articleCategories.length} article_categories links`);
  } catch (e: any) {
    console.warn('⚠️ Could not migrate article_categories:', e.message);
  }

  // 7. carousel_images
  try {
    const carouselImages = await fetchFromSupabase(supabaseUrl, serviceKey, 'carousel_images');
    for (const r of carouselImages) {
      await sql`
        INSERT INTO public.carousel_images (id, image_url, public_id, alt, caption, sort_order, active, created_at)
        VALUES (${r.id}, ${r.image_url}, ${r.public_id ?? null}, ${r.alt ?? ''}, ${r.caption ?? ''}, ${r.sort_order ?? 0}, ${r.active ?? true}, ${r.created_at})
        ON CONFLICT (id) DO UPDATE SET
          image_url = EXCLUDED.image_url,
          public_id = EXCLUDED.public_id,
          alt = EXCLUDED.alt,
          caption = EXCLUDED.caption,
          sort_order = EXCLUDED.sort_order,
          active = EXCLUDED.active
      `;
    }
    console.log(`✅ Migrated ${carouselImages.length} carousel images`);
  } catch (e: any) {
    console.warn('⚠️ Could not migrate carousel_images:', e.message);
  }

  console.log('🎉 Data migration from Supabase to Neon Database completed successfully!');
}

main().catch((err) => {
  console.error('❌ Data migration failed:', err);
  process.exit(1);
});
