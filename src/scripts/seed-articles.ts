import { sql } from '../lib/db';
import { slugify, estimateReadingMinutes } from '../lib/slug';

/**
 * Seeds starter SEO articles (original copy) and categories. Safe to re-run: upserts by slug.
 * Articles are published; edit or unpublish them anytime from the admin dashboard.
 */

type Seed = {
  title: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  categories: string[];
  daysAgo: number;
  featured?: boolean;
  html: string;
};

const CATEGORIES: Record<string, string> = {
  'Wall Panels': 'Ideas and guides for WPC, fluted, acoustic and decorative wall panels.',
  Flooring: 'SPC, vinyl and composite flooring guides for indoor and outdoor spaces.',
  'Decor Guides': 'Buying tips, styling advice and care guides for interior finishes.',
};

const ARTICLES: Seed[] = [
  {
    title: 'WPC Wall Panels: A Practical Buyer Guide',
    excerpt:
      'Thinking about WPC wall panels? Learn what they are made of, where they work best, how they compare with wood and PVC, and what to check before you buy.',
    metaTitle: 'WPC Wall Panels: What They Are & How to Choose',
    metaDescription:
      'A plain-English guide to WPC wall panels: materials, benefits, comparison with wood and PVC, styling ideas and a pre-purchase checklist.',
    keywords: ['WPC wall panels', 'wood plastic composite', 'interior wall cladding', 'wall panel buying guide'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 2,
    featured: true,
    html: `<p>If you have browsed interior design inspiration lately, you have probably seen ribbed, wood-toned walls that look warm and expensive. Many of them are <strong>WPC wall panels</strong>. This guide explains what they are, why designers like them, and how to pick the right ones for your space.</p>
<h2>What is a WPC wall panel?</h2>
<p>WPC stands for wood plastic composite. The panel is made by blending fine wood fibre with a thermoplastic binder and a few additives, then shaping the mixture into long, interlocking boards. The result looks like timber but behaves more like a modern engineered material. Most panels have a hollow or ribbed core, which keeps them light and easy to handle.</p>
<h2>Why people choose them</h2>
<ul>
<li><strong>Low upkeep:</strong> no sanding, varnishing or repainting. A dry cloth and occasional gentle cleaning is usually enough.</li>
<li><strong>Better moisture behaviour than raw wood:</strong> the plastic binder protects the wood fibre, so panels are far less prone to swelling and warping.</li>
<li><strong>Consistent finish:</strong> colour and texture are uniform from board to board, which makes large walls look neat.</li>
<li><strong>Fast installation:</strong> tongue-and-groove edges and clips mean a feature wall can often be done in a day.</li>
<li><strong>Light weight:</strong> easier on walls, easier to transport and easier to cut on site.</li>
</ul>
<h2>WPC compared with other wall finishes</h2>
<p><strong>Solid wood</strong> looks beautiful but needs regular care and reacts to humidity. <strong>PVC panels</strong> are budget-friendly yet can feel thin and less premium. <strong>Paint or wallpaper</strong> is quick and cheap but marks easily and needs refreshing. WPC sits in the middle: richer in texture than PVC, steadier than timber and easier to live with than paint.</p>
<h2>Where they work best</h2>
<p>Living-room feature walls, TV backdrops, bedroom headboard walls, office reception areas, boardrooms, hotel corridors and shop interiors. For rooms with direct rain or sun exposure, ask for an outdoor-rated WPC product instead of an indoor one.</p>
<h2>Styling tips</h2>
<ul>
<li>Run the ribs <strong>vertically</strong> to make ceilings feel taller.</li>
<li>Choose <strong>warm walnut or oak tones</strong> for cosy rooms and lighter shades for small, dim spaces.</li>
<li>Add <strong>LED strips</strong> beside or behind the panels to create soft shadow lines at night.</li>
<li>Limit panels to one wall in a small room so the space does not feel closed in.</li>
</ul>
<h2>Checklist before you buy</h2>
<ol>
<li>Confirm the panel is rated for <strong>indoor or outdoor</strong> use.</li>
<li>Ask for a <strong>sample</strong> and check the colour in your own room lighting.</li>
<li>Check the board <strong>thickness and length</strong> against your wall height to reduce joins and waste.</li>
<li>Ask what <strong>trims, end caps and clips</strong> are needed and whether they are sold with the panels.</li>
<li>Add about <strong>10% extra</strong> to your area for cuts and mistakes.</li>
</ol>
<h2>Need help choosing?</h2>
<p>Send us your wall size and the look you want and we will recommend a suitable panel and quantity, with a free quote and no obligation.</p>`,
  },
  {
    title: 'Fluted Wall Panels: How to Style, Light and Install Them',
    excerpt:
      'Fluted panels are one of the biggest interior trends. See where they work, how to light them for drama, and the installation basics to get a clean finish.',
    metaTitle: 'Fluted Wall Panels: Styling, Lighting & Installation Tips',
    metaDescription:
      'How to use fluted wall panels at home or in the office: layout ideas, lighting tricks, installation basics and common mistakes to avoid.',
    keywords: ['fluted wall panels', 'ribbed wall panels', 'feature wall ideas', 'TV wall design'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 6,
    html: `<p>Fluted, or ribbed, wall panels bring depth and rhythm to a flat wall. The vertical grooves catch light differently through the day, which makes even a simple room feel designed. Here is how to use them well.</p>
<h2>Where fluted panels look great</h2>
<ul>
<li>Behind a <strong>TV or fireplace</strong> as a statement wall</li>
<li>As a <strong>headboard wall</strong> in the bedroom</li>
<li>In <strong>reception areas</strong> and office lobbies where first impressions matter</li>
<li>Along <strong>staircases and corridors</strong> to add interest to long walls</li>
<li>Around <strong>bar and counter backdrops</strong> in restaurants and lounges</li>
</ul>
<h2>Pick the right colour and finish</h2>
<p>Natural wood tones feel warm and classic. Charcoal and black look dramatic and modern. White and soft grey keep small rooms bright. A matte finish hides fingerprints and reduces glare, which is useful in busy or well-lit spaces.</p>
<h2>Lighting makes the difference</h2>
<p>Because the surface is textured, <strong>side lighting</strong> shows it off best. Try warm LED strips set into a recess, wall washers from the ceiling, or slim wall lights on either side. Avoid a single harsh spotlight pointed straight at the wall, which can flatten the effect.</p>
<h2>Installation basics</h2>
<ol>
<li><strong>Check the wall.</strong> It should be dry, clean and reasonably flat. Fix damp problems first.</li>
<li><strong>Mark a vertical reference line</strong> with a spirit level so the first board starts straight.</li>
<li><strong>Fix battens or glue</strong> according to the panel type and your wall surface.</li>
<li><strong>Interlock boards one by one</strong>, checking alignment as you go.</li>
<li><strong>Leave a small expansion gap</strong> at the edges and cover it with trim.</li>
<li><strong>Finish with trims and end caps</strong> for clean corners.</li>
</ol>
<h2>Common mistakes</h2>
<ul>
<li>Skipping the sample and discovering the shade looks different at home</li>
<li>Starting on an uneven wall, so gaps grow towards the top</li>
<li>Forgetting trims in the order</li>
<li>Covering every wall in the room, which can make the space feel heavy</li>
</ul>
<p>Not sure which style suits your room? Tell us the dimensions and the look you like, and we will help you pick.</p>`,
  },
  {
    title: 'SPC vs WPC vs Vinyl Flooring: Which Should You Choose?',
    excerpt:
      'Confused by flooring acronyms? We compare SPC, WPC and vinyl so you can choose the right floor for comfort, durability and budget.',
    metaTitle: 'SPC vs WPC vs Vinyl Flooring: How to Choose',
    metaDescription:
      'Compare SPC, WPC and vinyl flooring side by side: durability, comfort, water behaviour, best rooms and what to ask before you buy.',
    keywords: ['SPC flooring', 'WPC flooring', 'vinyl flooring', 'best flooring for home', 'flooring comparison'],
    categories: ['Flooring', 'Decor Guides'],
    daysAgo: 10,
    html: `<p>Modern flooring comes with a lot of letters. Here is a simple comparison to help you choose between <strong>SPC</strong>, <strong>WPC</strong> and <strong>vinyl</strong>.</p>
<h2>SPC flooring</h2>
<p>SPC (stone plastic composite) has a dense, rigid core made largely from mineral powder. It is hard-wearing, dimensionally stable and handles heavy furniture and foot traffic well. The trade-off is that it feels firmer underfoot.</p>
<p><strong>Best for:</strong> living rooms, shops, offices and busy hallways.</p>
<h2>WPC flooring</h2>
<p>Indoor WPC flooring uses a slightly softer, thicker core, so it feels more cushioned and quieter to walk on. It is a good choice where comfort matters. Outdoor WPC decking is a different product designed for weather exposure, so always specify which one you need.</p>
<p><strong>Best for:</strong> bedrooms, family rooms and spaces where you stand for long periods. Outdoor WPC suits patios, balconies and gardens.</p>
<h2>Vinyl flooring</h2>
<p>Standard vinyl, in planks, tiles or sheets, is the most budget-friendly option and comes in a huge range of designs. It is thinner, so a smooth subfloor matters more.</p>
<p><strong>Best for:</strong> rentals, quick refreshes and tight budgets.</p>
<h2>Quick comparison</h2>
<ul>
<li><strong>Toughness:</strong> SPC is usually the strongest, then WPC, then standard vinyl.</li>
<li><strong>Comfort:</strong> WPC and vinyl feel softer than SPC.</li>
<li><strong>Cost:</strong> vinyl is typically the lowest, with SPC and WPC priced by thickness and wear layer.</li>
<li><strong>Look:</strong> all three come in wood, stone and concrete effects.</li>
</ul>
<h2>What to ask before buying</h2>
<ol>
<li>What is the <strong>wear layer</strong> thickness?</li>
<li>Is it suitable for the <strong>room and moisture level</strong> you have?</li>
<li>Does it need an <strong>underlay</strong>?</li>
<li>What <strong>installation method</strong> does it use (click-lock or glue-down)?</li>
<li>Can you see a <strong>sample</strong> in your lighting?</li>
</ol>
<p>Send us the room sizes and how the space is used, and we will suggest the best option and give you a free quote.</p>`,
  },
  {
    title: 'Acoustic Wall Panels: Quieter Rooms Without Losing Style',
    excerpt:
      'Echo-filled rooms are tiring. Learn how acoustic wall panels reduce noise and reverberation while adding a polished look to offices, homes and studios.',
    metaTitle: 'Acoustic Wall Panels: Reduce Echo & Add Style',
    metaDescription:
      'How acoustic wall panels work, where to use them, and how to choose a design that improves sound and looks great in homes and offices.',
    keywords: ['acoustic wall panels', 'sound absorbing panels', 'noise reduction', 'office interior design'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 14,
    html: `<p>Hard walls, tile floors and glass make modern rooms look sharp, but they also bounce sound around. The result is echo, muddy conversations and tiring meetings. <strong>Acoustic wall panels</strong> soften that sound while doubling as decoration.</p>
<h2>How they work</h2>
<p>Acoustic panels have a surface and backing designed to absorb sound energy instead of reflecting it. This shortens the echo (reverberation) inside the room so voices and music sound clearer. They improve how a room <em>sounds</em> inside; they are not the same as full soundproofing that blocks noise from passing through walls.</p>
<h2>Where to use them</h2>
<ul>
<li><strong>Offices and meeting rooms</strong> for clearer calls and conversations</li>
<li><strong>Restaurants and cafes</strong> where noise builds up quickly</li>
<li><strong>Home theatres and music rooms</strong> for cleaner audio</li>
<li><strong>Schools, churches and event halls</strong> with high ceilings and hard surfaces</li>
<li><strong>Open-plan living spaces</strong> that feel echoey</li>
</ul>
<h2>Design options</h2>
<p>Modern acoustic panels come in slatted wood-look finishes, fabric-wrapped boards and perforated designs. Slatted styles blend into a decor scheme and look like a deliberate feature wall instead of a technical add-on.</p>
<h2>Planning coverage</h2>
<ul>
<li>You rarely need to cover every wall. Treating <strong>part of the wall area</strong>, especially opposite hard surfaces, can make a clear difference.</li>
<li>Add soft furnishings such as <strong>curtains and rugs</strong> to help absorb more sound.</li>
<li>Place panels at <strong>head height</strong> where voices travel.</li>
</ul>
<h2>Questions to ask the supplier</h2>
<ol>
<li>Is the panel designed for <strong>sound absorption</strong>, or purely decorative?</li>
<li>What <strong>backing material</strong> does it use?</li>
<li>How is it <strong>installed</strong> and what fixings are included?</li>
<li>What colours and finishes are available?</li>
</ol>
<p>Tell us about your room and what bothers you about the sound, and we will recommend a suitable panel.</p>`,
  },
  {
    title: 'Flexible Stone and Ceramic Tile: Natural Looks, Lighter Weight',
    excerpt:
      'Love the look of stone or brick but worried about weight and cost? Flexible stone and flexible ceramic tile may be the answer. Here is how they work.',
    metaTitle: 'Flexible Stone & Ceramic Tile: Uses, Pros & Tips',
    metaDescription:
      'A beginner guide to flexible stone and flexible ceramic tile for interior and exterior walls: benefits, uses, installation and care.',
    keywords: ['flexible stone', 'flexible ceramic tile', 'stone wall cladding', 'lightweight wall tiles'],
    categories: ['Decor Guides'],
    daysAgo: 18,
    html: `<p>Real stone walls look fantastic, but the weight, cost and installation effort put many people off. <strong>Flexible stone</strong> and <strong>flexible ceramic tile</strong> offer a similar character in a thin, light and bendable form.</p>
<h2>What are they?</h2>
<p>These are very thin wall-cladding sheets finished to resemble natural stone, brick, slate or textured ceramic. Because they are thin and flexible, they can follow gentle curves, wrap around columns and be cut with simple tools.</p>
<h2>Advantages</h2>
<ul>
<li><strong>Lightweight:</strong> puts little load on the wall and is easier to transport and handle.</li>
<li><strong>Quicker to install</strong> than heavy natural stone or traditional tiles.</li>
<li><strong>Curved surface friendly:</strong> suitable for arches, columns and rounded features.</li>
<li><strong>Wide look range:</strong> brick, slate, travertine and cement-style textures.</li>
<li><strong>Often more budget-friendly</strong> than natural stone once installation is counted.</li>
</ul>
<h2>Popular uses</h2>
<ul>
<li>Feature walls and fireplaces</li>
<li>Shop fronts, reception desks and bar fronts</li>
<li>Entrance walls and gate pillars (choose an outdoor-rated product)</li>
<li>Restaurant and hotel interiors</li>
</ul>
<h2>Installation tips</h2>
<ol>
<li>Start with a <strong>clean, dry, flat surface</strong>.</li>
<li>Use the <strong>adhesive recommended</strong> for the product and substrate.</li>
<li>Mix pieces from <strong>several boxes</strong> so pattern and shade look natural.</li>
<li>Follow the supplier guidance on <strong>grouting or joint treatment</strong>.</li>
<li>Seal edges and corners as advised for wet or exterior areas.</li>
</ol>
<h2>Care</h2>
<p>Wipe with a damp cloth and mild cleaner. Avoid harsh chemicals and abrasive pads, which can dull the surface.</p>
<p>Share a photo of your wall and the look you want, and we will suggest the right product and quantity.</p>`,
  },
  {
    title: 'How to Clean and Care for Wall Panels and Flooring',
    excerpt:
      'Keep composite wall panels and flooring looking new with these simple, safe cleaning habits, and learn which products to avoid.',
    metaTitle: 'How to Clean & Maintain Wall Panels and Flooring',
    metaDescription:
      'Easy care guide for WPC wall panels, SPC and vinyl flooring: daily habits, deep cleaning, products to avoid and when to call for help.',
    keywords: ['clean wall panels', 'care for SPC flooring', 'maintain WPC panels', 'floor cleaning tips'],
    categories: ['Decor Guides'],
    daysAgo: 22,
    html: `<p>One of the best things about modern composite panels and flooring is how easy they are to look after. A few good habits will keep them looking fresh for years.</p>
<h2>Wall panels</h2>
<ul>
<li><strong>Dust regularly</strong> with a dry microfibre cloth, especially on fluted or ribbed surfaces where dust settles in the grooves.</li>
<li><strong>Wipe marks</strong> with a slightly damp cloth and a mild, pH-neutral cleaner.</li>
<li>Use a <strong>soft brush or vacuum brush attachment</strong> for the grooves.</li>
<li><strong>Dry the surface</strong> afterwards instead of leaving water to sit.</li>
</ul>
<h2>Flooring</h2>
<ul>
<li><strong>Sweep or vacuum</strong> often to remove grit that can scratch the surface.</li>
<li>Mop with a <strong>well-wrung mop</strong> and a floor cleaner suitable for the product. Avoid flooding the floor.</li>
<li>Place <strong>doormats</strong> at entrances and <strong>felt pads</strong> under furniture legs.</li>
<li>Wipe up spills quickly.</li>
</ul>
<h2>What to avoid</h2>
<ul>
<li>Bleach, acetone, strong solvents and abrasive scouring pads</li>
<li>Steam cleaners unless the manufacturer says they are safe</li>
<li>Dragging heavy furniture without protection</li>
<li>Wax or polish that the supplier does not recommend</li>
</ul>
<h2>Seasonal check</h2>
<p>Every few months, look over trims, corner pieces and joints. Reseal or re-fix anything that has loosened, and keep the expansion gaps clear.</p>
<p>If you are unsure whether a cleaner is safe for your product, test it on a hidden corner first, or ask us.</p>`,
  },
];

async function main() {
  console.log('Seeding categories and articles...');

  const catIds: Record<string, string> = {};
  for (const [name, description] of Object.entries(CATEGORIES)) {
    const slug = slugify(name);
    const rows = await sql`
      INSERT INTO public.categories (name, slug, description)
      VALUES (${name}, ${slug}, ${description})
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description
      RETURNING id`;
    catIds[name] = rows[0].id as string;
  }

  for (const a of ARTICLES) {
    const slug = slugify(a.title);
    const publishedAt = new Date(Date.now() - a.daysAgo * 86_400_000).toISOString();
    const rows = await sql`
      INSERT INTO public.articles
        (slug, title, excerpt, content_html, meta_title, meta_description, keywords,
         status, featured, author, reading_minutes, published_at)
      VALUES
        (${slug}, ${a.title}, ${a.excerpt}, ${a.html}, ${a.metaTitle}, ${a.metaDescription},
         ${a.keywords}, 'published', ${a.featured ?? false}, 'Nasuru Interios',
         ${estimateReadingMinutes(a.html)}, ${publishedAt})
      ON CONFLICT (slug) DO UPDATE SET
        title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, content_html = EXCLUDED.content_html,
        meta_title = EXCLUDED.meta_title, meta_description = EXCLUDED.meta_description,
        keywords = EXCLUDED.keywords, reading_minutes = EXCLUDED.reading_minutes,
        featured = EXCLUDED.featured
      RETURNING id`;
    const articleId = rows[0].id as string;
    await sql`DELETE FROM public.article_categories WHERE article_id = ${articleId}`;
    for (const c of a.categories) {
      await sql`
        INSERT INTO public.article_categories (article_id, category_id)
        VALUES (${articleId}, ${catIds[c]}) ON CONFLICT DO NOTHING`;
    }
    console.log(`  ✓ ${slug}`);
  }

  console.log('✅ Done.');
}

main().catch((err) => {
  console.error('❌ Failed to seed articles:', err);
  process.exit(1);
});
