import { sql } from '../lib/db';

async function main() {
  console.log('Seeding SEO-optimized About content into Neon Database...');

  const headline = 'About {business_name}';
  const subheading =
    "Lagos, Nigeria's Premier Supplier & Installer of Premium Long-Span, Stone-Coated, and Custom Aluminium Roofing Sheets";

  const bodyHtml = `<p>Welcome to <strong>{business_name}</strong>, your premier partner for high-grade aluminium roofing solutions in Lagos and across Nigeria. Built on uncompromised structural integrity and modern architectural aesthetics, <strong>{business_name}</strong> supplies and installs top-quality aluminium roofing sheets engineered for tropical weather resilience.</p>
<h3>Our Core Products &amp; Capabilities</h3>
<p>At <strong>{business_name}</strong>, we provide a complete spectrum of roofing sheet designs tailored for residential homes, commercial complexes, and industrial developments:</p>
<ul>
  <li><strong>Long-Span Aluminium Sheets:</strong> Precision-milled, rust-proof, and lightweight sheets ideal for modern homes and commercial buildings.</li>
  <li><strong>Step-Tiles &amp; Metcoppo Profiles:</strong> Architecturally sophisticated roofing sheets that blend classic tile aesthetics with heavy-duty aluminium durability.</li>
  <li><strong>Stone-Coated Roof Tiles:</strong> Premium stone-chip coated roofing tiles offering superior acoustic insulation and heat resistance.</li>
  <li><strong>Custom Accessories &amp; Flashing:</strong> Matching gutters, ridge caps, fascia boards, and specialized flashing components engineered for zero-leakage protection.</li>
</ul>
<h3>Why Work With {business_name}?</h3>
<p>Selecting the right roof is a vital structural investment. Here is why property developers, site engineers, and homeowners across Lagos rely on <strong>{business_name}</strong>:</p>
<ul>
  <li><strong>Certified Gauge Integrity:</strong> We guarantee true gauge thickness (0.45mm, 0.55mm, 0.70mm+) without compromises, ensuring maximum wind and corrosion resistance.</li>
  <li><strong>Factory-Direct Rates:</strong> Direct partnerships with top aluminium coil manufacturers allow <strong>{business_name}</strong> to offer factory-direct pricing with no middleman markup.</li>
  <li><strong>Turnkey Professional Installation:</strong> Certified roofing installers ensure precise structural alignment, watertight sealing, and long-lasting durability.</li>
  <li><strong>Nationwide Logistics:</strong> Headquartered in Lagos, <strong>{business_name}</strong> delivers materials directly to project sites throughout Nigeria.</li>
</ul>
<h3>Our Quality Commitment</h3>
<p>Whether you are building your personal residence, renovating a commercial property, or managing a large housing development, <strong>{business_name}</strong> is committed to delivering roofing solutions that combine strength, beauty, and lasting value.</p>`;

  const stats = [
    { label: 'Industry Experience', value: '15+ Years' },
    { label: 'Projects Delivered', value: '2,500+' },
    { label: 'Leak-Free Guarantee', value: '100%' },
    { label: 'States Covered', value: '36' },
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
