import { sql } from '../lib/db';

async function main() {
  console.log('Seeding SEO-optimized About content into Neon Database...');

  const headline = 'About {business_name}';
  const subheading =
    'Your Interior Deco Supply Partner for Curtains, Wallpapers, Wall Panels, Flooring, Lighting & Decor';

  const bodyHtml = `<p>Welcome to <strong>{business_name}</strong>, your one-stop interior deco supply store for homeowners, interior designers, contractors and property developers. We source and supply quality finishes and decor that turn ordinary rooms into beautiful, functional spaces.</p>
<h3>What We Supply</h3><p>From a single room refresh to a full fit-out, <strong>{business_name}</strong> stocks everything you need to bring your interior design vision to life:</p>
<ul>
  <li><strong>Curtains, Blinds &amp; Upholstery Fabrics:</strong> Sheers, blackout curtains, roller and Roman blinds, plus premium fabrics for sofas, cushions and headboards.</li>
  <li><strong>Wall Panels &amp; Wallpapers:</strong> WPC and PVC wall panels, fluted (ribbed) panels, acoustic panels, 3D and textured wallpapers for feature walls.</li><li><strong>Flexible Stone &amp; Tiles:</strong> lightweight flexible stone and ceramic-look cladding for walls, columns and fireplaces.</li>
  <li><strong>Flooring &amp; Rugs:</strong> SPC, WPC and vinyl flooring, carpets and rugs that balance style with durability.</li><li><strong>Outdoor Decor:</strong> WPC decking, fence panels and cladding for patios, balconies and gardens.</li>
  <li><strong>Ceilings &amp; Lighting:</strong> PVC and POP ceiling accessories, chandeliers, pendant lights, wall lights and LED strip lighting.</li>
  <li><strong>Decor Accessories:</strong> Mirrors, vases, cushions, throws, artificial plants and finishing touches that complete a room.</li>
</ul>
<h3>Why Choose {business_name}?</h3><p>Great interiors start with the right materials. Here is why homeowners, designers and developers rely on <strong>{business_name}</strong>:</p>
<ul>
  <li><strong>Curated Quality:</strong> Every product is selected for finish, durability and lasting good looks.</li>
  <li><strong>Wide Range of Styles:</strong> Modern, classic, minimalist or luxury &mdash; we stock designs for every taste and budget.</li>
  <li><strong>Fair, Transparent Pricing:</strong> Competitive rates with honest quotes and trade pricing for bulk and project orders.</li>
  <li><strong>Helpful Advice:</strong> Not sure what suits your space? Our team helps you choose colours, textures and quantities.</li>
</ul>
<h3>Our Commitment</h3><p>Whether you are furnishing a new home, refreshing an apartment, or outfitting an office, hotel or showroom, <strong>{business_name}</strong> is committed to supplying interior products that combine beauty, quality and value.</p>`;

  const stats = [
    { label: 'Product Categories', value: '5+' },
    { label: 'Happy Clients', value: '1,000+' },
    { label: 'Quality Checked', value: '100%' },
    { label: 'Free Quotes', value: 'Always' },
  ];

  const rows = await sql`
    INSERT INTO public.about_content (id, headline, subheading, body_html, stats, updated_at)
    VALUES (1, ${headline}, ${subheading}, ${bodyHtml}, ${JSON.stringify(stats)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET
      headline = EXCLUDED.headline,
      subheading = EXCLUDED.subheading,
      body_html = EXCLUDED.body_html,
      stats = EXCLUDED.stats,
      updated_at = NOW()
    RETURNING id, headline, subheading, updated_at;
  `;

  console.log('✅ About content seeded into database successfully:', rows[0]);
}

main().catch((err) => {
  console.error('❌ Failed to seed About content:', err);
  process.exit(1);
});
