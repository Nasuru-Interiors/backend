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
  'Curtains & Fabrics': 'Curtains, blinds and upholstery fabric guides for Nigerian homes and offices.',
  'Wallpaper & Stone': 'Wallpaper and stone-effect cladding ideas for feature walls.',
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
  {
    title: 'PVC Wall Panels: Pros, Cons and Where They Work Best',
    excerpt:
      'PVC wall panels are one of the most affordable ways to refresh a room. Learn where they shine, where they do not, and how to choose a good quality panel.',
    metaTitle: 'PVC Wall Panels: Pros, Cons & Best Uses',
    metaDescription:
      'Everything you need to know about PVC wall panels: benefits, limits, best rooms, installation basics and buying tips for homes and offices.',
    keywords: ['PVC wall panels', 'PVC cladding', 'affordable wall panels', 'bathroom wall panels', 'kitchen wall panels'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 1,
    html: `<p>If you want a clean, modern wall without the cost of tiles or the mess of plastering, <strong>PVC wall panels</strong> are worth a look. They are light, quick to fit and available in a wide range of looks.</p>
<h2>What are PVC wall panels?</h2>
<p>PVC wall panels are made from polyvinyl chloride and formed into flat or profiled boards that click or slot together. Many are printed or laminated with finishes such as wood grain, marble, plain colours and 3D textures.</p>
<h2>Advantages</h2>
<ul>
<li><strong>Affordable:</strong> usually among the lowest-cost panel options.</li>
<li><strong>Water resistant:</strong> the material does not soak up moisture, which suits damp-prone areas.</li>
<li><strong>Easy to clean:</strong> a damp cloth removes most marks.</li>
<li><strong>Quick to install:</strong> light boards that can be cut with basic tools.</li>
<li><strong>Many designs:</strong> from calm plain colours to bold marble and wood effects.</li>
</ul>
<h2>Limitations to know</h2>
<ul>
<li>PVC can feel <strong>less rigid and less premium</strong> than WPC or solid wood alternatives.</li>
<li>Thin panels can <strong>dent or scratch</strong> in busy areas.</li>
<li>Panels are not a substitute for fixing a damp wall. Treat moisture problems first.</li>
<li>Keep them away from <strong>direct heat sources</strong> such as stoves and open flames.</li>
</ul>
<h2>Best places to use them</h2>
<p>Bathrooms and toilets, kitchens (away from the cooker), laundry areas, shop interiors, stairwell walls, kids rooms and ceilings in low-traffic spaces. For feature walls where you want more depth and weight, consider WPC or fluted panels instead.</p>
<h2>How to choose a good one</h2>
<ol>
<li>Check the <strong>thickness</strong> and press the surface gently. It should not flex too easily.</li>
<li>Look at the <strong>joints</strong>. Edges should lock together tightly.</li>
<li>Ask about <strong>colour consistency</strong> between batches.</li>
<li>Ask which <strong>trims and corner pieces</strong> are available.</li>
<li>Request a <strong>sample</strong> and view it in your own room light.</li>
</ol>
<h2>Installation overview</h2>
<p>Clean the wall, fix battens if the surface is uneven, start from one corner with a level line, interlock each panel, then finish edges with trims. Leave small gaps where the supplier recommends so the boards can expand slightly with temperature.</p>
<p>Tell us the room and the look you want, and we will recommend the right PVC panel with a free quote.</p>`,
  },
  {
    title: 'PU Stone Wall Panels: Get the Stone Look Without the Weight',
    excerpt:
      'PU stone wall panels copy the texture of natural stone and brick in a light, easy-to-install board. See how they work and where to use them.',
    metaTitle: 'PU Stone Wall Panels: Uses, Benefits & Installation',
    metaDescription:
      'What PU stone wall panels are, how they compare with real stone, where to use them indoors and outdoors, and how to install and care for them.',
    keywords: ['PU stone panels', 'PU stone wall panel', 'faux stone cladding', 'lightweight stone panel', 'stone effect wall'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 3,
    html: `<p>Natural stone walls look timeless, but they are heavy, expensive and slow to install. <strong>PU stone wall panels</strong> give you a very similar character with a fraction of the weight.</p>
<h2>What is PU stone?</h2>
<p>PU stands for polyurethane. Manufacturers cast it in moulds taken from real stone, brick or slate, then colour it by hand or machine. The result is a lightweight panel with realistic ridges, edges and tones.</p>
<h2>Why people choose PU stone</h2>
<ul>
<li><strong>Much lighter</strong> than real stone, so walls carry less load and handling is easier.</li>
<li><strong>Fast to fit:</strong> panels are glued or fixed and can be cut with common tools.</li>
<li><strong>Realistic look</strong> in stacked stone, rough brick, slate and rock textures.</li>
<li><strong>Good insulation properties</strong> compared with solid masonry.</li>
<li><strong>Lower overall cost</strong> once transport and installation are included.</li>
</ul>
<h2>Where to use it</h2>
<ul>
<li>Living-room feature walls and fireplace surrounds (keep clear of direct flame)</li>
<li>Reception and lobby walls</li>
<li>Restaurant, cafe and bar interiors</li>
<li>Entrance walls and garden features, using products rated for outdoor use</li>
<li>Gate pillars and boundary wall accents</li>
</ul>
<h2>PU stone vs real stone</h2>
<p>Real stone wins on authenticity and long history. PU stone wins on weight, speed and budget, and it is more forgiving on walls that cannot carry heavy cladding. For most homes and commercial interiors, the visual difference is small once installed.</p>
<h2>Installation tips</h2>
<ol>
<li>Make sure the wall is <strong>clean, dry and sound</strong>.</li>
<li>Do a <strong>dry lay</strong> of the panels on the floor first to plan the pattern.</li>
<li>Use the <strong>adhesive recommended</strong> for the product, plus fixings if advised.</li>
<li>Mix panels from several boxes so patterns do not repeat in obvious blocks.</li>
<li>Fill joints and touch up edges as per the supplier guidance.</li>
</ol>
<h2>Care</h2>
<p>Dust with a soft brush or vacuum brush. Wipe with a damp cloth when needed and avoid strong solvents. For outdoor use, check that the panel is UV-stable.</p>
<p>Want to see colours and textures? Ask us for samples and a free quote.</p>`,
  },
  {
    title: 'How to Choose Curtains: Fabric, Length, Colour and Fit',
    excerpt:
      'The right curtains can change the whole mood of a room. Learn how to pick fabric, length, fullness and colour like a designer.',
    metaTitle: 'How to Choose Curtains: Fabric, Length & Colour Guide',
    metaDescription:
      'A simple guide to choosing curtains for your home: fabric types, correct length and width, colour choices, lining and styling tips.',
    keywords: ['how to choose curtains', 'curtain fabric', 'living room curtains', 'blackout curtains', 'curtain length'],
    categories: ['Curtains & Fabrics', 'Decor Guides'],
    daysAgo: 5,
    featured: false,
    html: `<p>Curtains do more than cover a window. They add softness, control light, give privacy and tie the colours of a room together. Here is how to choose them with confidence.</p>
<h2>1. Decide what the curtains must do</h2>
<ul>
<li><strong>Privacy and light control:</strong> choose lined or blackout fabric.</li>
<li><strong>Soft daylight:</strong> sheer or voile curtains let light in while keeping the view hazy.</li>
<li><strong>Insulation and sound:</strong> heavier fabrics and thick lining help.</li>
<li><strong>Decoration only:</strong> go for the texture and colour you love.</li>
</ul>
<h2>2. Pick the right fabric</h2>
<ul>
<li><strong>Sheer / voile:</strong> light, airy, ideal as an inner layer.</li>
<li><strong>Linen and linen-look:</strong> relaxed texture and a natural finish.</li>
<li><strong>Velvet:</strong> rich, heavy and luxurious. Great for bedrooms and formal rooms.</li>
<li><strong>Blackout:</strong> dense backing that blocks most light, good for bedrooms and media rooms.</li>
<li><strong>Jacquard:</strong> woven patterns that suit classic and formal interiors.</li>
</ul>
<h2>3. Get the measurements right</h2>
<ul>
<li><strong>Width:</strong> the curtain fabric should be roughly <strong>two times the track or rod width</strong> for a full, elegant fold.</li>
<li><strong>Height:</strong> mount the rod or track <strong>higher than the window frame</strong>, close to the ceiling, to make the room feel taller.</li>
<li><strong>Length:</strong> curtains can just kiss the floor, hover slightly above it, or pool softly for a dramatic look. Avoid awkward half-way lengths.</li>
</ul>
<h2>4. Choose the colour</h2>
<p>Pick a shade from your room rather than something that clashes. Neutral curtains such as cream, grey and beige suit most spaces. Deep green, navy and burgundy make bold statements. Patterns work best when the rest of the room is plain.</p>
<h2>5. Layer for a designer finish</h2>
<p>Pair <strong>sheers with heavier curtains</strong> on a double track. During the day, keep the sheers closed for soft light. At night, draw the heavier layer for privacy and warmth.</p>
<h2>6. Heading styles</h2>
<p>Pinch pleat and wave headings look tailored and formal. Eyelet headings look modern and are easy to slide. Tab and pocket styles feel casual.</p>
<h2>Care</h2>
<p>Follow the washing label and avoid ironing velvet directly. Vacuum curtains gently now and then to remove dust.</p>
<p>Send us your window sizes and room style and we will help you choose fabric, lining and quantity.</p>`,
  },
  {
    title: 'Roller, Roman and Zebra Blinds: Which Blind Is Right for You?',
    excerpt:
      'Compare roller, Roman, zebra and venetian blinds so you can choose the right one for light control, privacy and style.',
    metaTitle: 'Blinds Guide: Roller, Roman, Zebra & Venetian Compared',
    metaDescription:
      'Compare the main types of window blinds for your home or office. Learn the pros, best rooms and care tips for each style.',
    keywords: ['window blinds', 'roller blinds', 'zebra blinds', 'Roman blinds', 'blinds vs curtains'],
    categories: ['Curtains & Fabrics', 'Decor Guides'],
    daysAgo: 8,
    html: `<p>Blinds are neat, space-saving and great for controlling light. Here is how the most popular types compare.</p>
<h2>Roller blinds</h2>
<p>A single sheet of fabric that rolls up and down. They are simple, modern and affordable. Choose blackout fabric for bedrooms and light-filtering fabric for living areas.</p>
<p><strong>Best for:</strong> kitchens, offices, bedrooms and small windows.</p>
<h2>Zebra (day and night) blinds</h2>
<p>Alternating sheer and solid stripes let you adjust light by sliding the layers. Closed gives privacy, aligned gives full light, and anything in between softens the glare.</p>
<p><strong>Best for:</strong> living rooms and offices where light changes through the day.</p>
<h2>Roman blinds</h2>
<p>Fabric folds into soft pleats as the blind rises. They feel warm and tailored, and work well with patterned or textured fabric.</p>
<p><strong>Best for:</strong> bedrooms, dining rooms and formal living rooms.</p>
<h2>Venetian blinds</h2>
<p>Horizontal slats in wood-look, aluminium or PVC. Tilt them to direct light up or down without fully opening.</p>
<p><strong>Best for:</strong> home offices and rooms where you want fine control over glare.</p>
<h2>Blinds or curtains?</h2>
<ul>
<li><strong>Blinds</strong> are tidy and take less space, good for small rooms and kitchens.</li>
<li><strong>Curtains</strong> add softness, colour and insulation, good for living rooms and bedrooms.</li>
<li>Many rooms look best with <strong>both</strong>: a blind for daily light control and curtains for style.</li>
</ul>
<h2>Measuring tips</h2>
<ol>
<li>Decide on <strong>inside-the-frame</strong> or <strong>outside-the-frame</strong> mounting.</li>
<li>Measure width and height in <strong>three places</strong> and use the smallest width for inside fits.</li>
<li>Add extra for overlap on outside fits to block light gaps.</li>
</ol>
<h2>Care</h2>
<p>Dust regularly with a soft cloth or duster. Spot-clean fabric blinds with a damp cloth and mild soap.</p>
<p>Share your window sizes and we will recommend the best blind and give you a free quote.</p>`,
  },
  {
    title: 'Wallpaper Ideas: How to Choose, Style and Apply Wallpaper',
    excerpt:
      'Wallpaper is back and better than ever. Discover styles, room-by-room ideas and the key steps for a smooth finish.',
    metaTitle: 'Wallpaper Ideas & Buying Guide for Every Room',
    metaDescription:
      'Wallpaper style ideas for living rooms, bedrooms and offices, plus how to measure, choose a type and apply wallpaper without bubbles.',
    keywords: ['wallpaper ideas', '3D wallpaper', 'living room wallpaper', 'bedroom wallpaper', 'how to apply wallpaper'],
    categories: ['Wallpaper & Stone', 'Decor Guides'],
    daysAgo: 11,
    html: `<p>Wallpaper is one of the fastest ways to give a room personality. From calm textures to bold murals, there is a design for every taste and space.</p>
<h2>Popular wallpaper styles</h2>
<ul>
<li><strong>Textured and embossed:</strong> add depth without a loud pattern.</li>
<li><strong>3D designs:</strong> raised patterns that create shadows and a modern feel.</li>
<li><strong>Floral and botanical:</strong> soft, natural and welcoming.</li>
<li><strong>Geometric:</strong> clean, contemporary and good for offices.</li>
<li><strong>Murals and scenic:</strong> a single large image that becomes the focal point.</li>
<li><strong>Marble and stone effect:</strong> luxury looks without heavy materials.</li>
</ul>
<h2>Room-by-room ideas</h2>
<ul>
<li><strong>Living room:</strong> a feature wall behind the sofa or TV in a textured or 3D design.</li>
<li><strong>Bedroom:</strong> soft, calming tones behind the bed. Avoid very busy patterns.</li>
<li><strong>Kids room:</strong> playful prints, with washable wallpaper for easy cleaning.</li>
<li><strong>Office:</strong> subtle geometric or textured designs that keep focus.</li>
<li><strong>Dining area:</strong> rich colours or botanical prints to set the mood.</li>
</ul>
<h2>Choosing the type</h2>
<ul>
<li><strong>Vinyl-coated:</strong> wipeable and durable, good for busy rooms.</li>
<li><strong>Non-woven:</strong> easier to hang and strip.</li>
<li><strong>Peel-and-stick:</strong> quick and renter-friendly for small projects.</li>
</ul>
<h2>Measuring and ordering</h2>
<ol>
<li>Measure the wall width and height.</li>
<li>Divide the width by the roll width and round up to get the number of drops.</li>
<li>Add extra length for <strong>pattern matching</strong>.</li>
<li>Order a little extra, and make sure all rolls come from the <strong>same batch</strong>.</li>
</ol>
<h2>Application basics</h2>
<ol>
<li>Prepare the wall: smooth, dry, clean and primed.</li>
<li>Mark a straight vertical line to start from.</li>
<li>Apply paste to the wall or paper, depending on the type.</li>
<li>Smooth from the centre outward to remove bubbles.</li>
<li>Trim the top and bottom neatly and wipe off excess paste.</li>
</ol>
<p>Want help choosing a pattern or estimating rolls? Send us your wall size and we will help.</p>`,
  },
  {
    title: 'Ceiling and Lighting Ideas to Lift Any Room',
    excerpt:
      'Great lighting and a well-finished ceiling transform a room. Explore layered lighting, ceiling styles and bulb tips.',
    metaTitle: 'Ceiling and Lighting Ideas for Nigerian Homes and Offices',
    metaDescription:
      'Practical ceiling and lighting ideas: layered lighting, chandeliers, pendants, LED strips, PVC and POP ceilings, and warm vs cool light.',
    keywords: ['ceiling design ideas', 'lighting ideas', 'LED strip lights', 'chandeliers', 'PVC ceiling'],
    categories: ['Decor Guides'],
    daysAgo: 15,
    html: `<p>Walls and furniture get the attention, but ceilings and lighting decide how a room actually feels. A few smart choices can make a space feel larger, warmer and more luxurious.</p>
<h2>Use layered lighting</h2>
<ul>
<li><strong>Ambient:</strong> the main light source, such as ceiling lights or a central fitting.</li>
<li><strong>Task:</strong> focused light for reading, cooking or working, such as desk lamps and under-cabinet lights.</li>
<li><strong>Accent:</strong> highlights features such as art, textured walls and shelves.</li>
</ul>
<h2>Popular fittings</h2>
<ul>
<li><strong>Chandeliers:</strong> a bold centrepiece for high ceilings, dining areas and entrances.</li>
<li><strong>Pendant lights:</strong> great over dining tables, kitchen islands and bedside areas.</li>
<li><strong>Recessed spotlights:</strong> clean and modern, good for even coverage.</li>
<li><strong>Wall lights:</strong> add soft glow beside beds, mirrors and artwork.</li>
<li><strong>LED strips:</strong> hidden in coves, behind TVs and under shelves for a soft glow.</li>
</ul>
<h2>Ceiling finishes</h2>
<ul>
<li><strong>POP / plaster designs:</strong> sculpted borders and cove details with built-in lighting.</li>
<li><strong>PVC ceiling panels:</strong> light, clean and moisture friendly, popular for kitchens, corridors and commercial spaces.</li>
<li><strong>Wood-look panels:</strong> bring warmth and a boutique feel to a lounge or restaurant.</li>
</ul>
<h2>Warm or cool light?</h2>
<p>Warm white (around 2700 to 3000K) suits bedrooms and living rooms. Neutral white (around 4000K) suits kitchens and workspaces. Cool white feels sharp and is best kept for utility areas. Dimmers add flexibility.</p>
<h2>Quick tips</h2>
<ol>
<li>Hang pendants <strong>about 75cm above</strong> a table surface.</li>
<li>Use <strong>more than one light source</strong> per room.</li>
<li>Match bulb colour temperature across the room.</li>
<li>Choose fittings that fit the <strong>ceiling height</strong>.</li>
</ol>
<p>Need ideas for a specific room? Tell us about it and we will help you plan the lighting and finishes.</p>`,
  },
  {
    title: 'Sofa and Upholstery Fabrics: How to Pick Fabric That Lasts',
    excerpt:
      'Choosing upholstery fabric can be confusing. Learn about durability, comfort, cleaning and the best fabrics for family homes.',
    metaTitle: 'Upholstery Fabric Guide: Choose Fabric for Sofas & Chairs',
    metaDescription:
      'Compare velvet, linen, leather-look, chenille and other upholstery fabrics, with tips on durability, cleaning and choosing for family life.',
    keywords: ['upholstery fabric', 'sofa fabric', 'velvet upholstery', 'best fabric for sofa', 'furniture fabric'],
    categories: ['Curtains & Fabrics', 'Decor Guides'],
    daysAgo: 19,
    html: `<p>A sofa is a big investment, so the fabric matters. The best choice balances good looks, comfort and how much wear it will get.</p>
<h2>Think about how you live</h2>
<ul>
<li><strong>Kids and pets:</strong> choose tightly woven, easy-clean fabrics.</li>
<li><strong>Heavy daily use:</strong> prioritise durability over delicate textures.</li>
<li><strong>Formal room:</strong> you can choose softer, more luxurious fabrics.</li>
<li><strong>Sunny rooms:</strong> pick fabrics with good fade resistance.</li>
</ul>
<h2>Popular upholstery fabrics</h2>
<ul>
<li><strong>Velvet:</strong> rich and soft with a luxurious sheen. Modern performance velvets are tougher than they look.</li>
<li><strong>Linen and linen blends:</strong> natural and breathable, but they crease. Blends are more durable.</li>
<li><strong>Chenille:</strong> soft and cosy with a plush hand-feel, popular for family sofas.</li>
<li><strong>Leather-look (faux leather):</strong> wipe-clean, stylish and low maintenance.</li>
<li><strong>Cotton blends:</strong> comfortable and versatile, often easy to refresh.</li>
</ul>
<h2>Check these before buying</h2>
<ol>
<li>Ask about <strong>abrasion or rub rating</strong> to understand durability.</li>
<li>Look at the <strong>weave</strong>. Tighter weaves resist snags and stains better.</li>
<li>Ask about <strong>cleaning instructions</strong> and whether it is stain-treated.</li>
<li>Get a <strong>swatch</strong> and test it in your own light.</li>
<li>Check the <strong>colour fastness</strong> if it will sit near windows.</li>
</ol>
<h2>Colour advice</h2>
<p>Mid-tone neutrals such as taupe, grey and sand hide wear well. Dark colours can show dust and lint. Light colours show marks quickly but look fresh and airy in the right setting.</p>
<h2>Care</h2>
<p>Vacuum often with a soft attachment, rotate cushions, blot spills quickly and avoid harsh cleaners. Follow the cleaning code on the fabric.</p>
<p>We stock fabrics for sofas, chairs, cushions and headboards. Ask for swatches and a free quote.</p>`,
  },
  {
    title: 'Wall Panels vs Paint vs POP: What Works Best in Nigerian Homes',
    excerpt:
      'Paint peels, POP cracks and plaster needs constant touch-ups. See how wall panels compare for Nigerian homes, offices, hotels and event halls.',
    metaTitle: 'Wall Panels vs Paint vs POP in Nigeria: Which Is Best?',
    metaDescription:
      'Compare wall panels, paint and POP finishes for Nigerian homes and businesses: cost over time, durability in humidity and rain, upkeep and looks.',
    keywords: ['wall panels in Nigeria', 'POP vs wall panels', 'interior wall finishes Nigeria', 'wall design Lagos', 'TV wall design Nigeria'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 0,
    featured: true,
    html: `<p>Walk into a new duplex in Lagos, Abuja or Port Harcourt and you will usually find three wall finishes: <strong>paint</strong>, <strong>POP</strong> (plaster of Paris) designs and, increasingly, <strong>wall panels</strong>. Each has a place. Here is how they compare in real Nigerian conditions.</p>
<h2>Paint</h2>
<p><strong>Good:</strong> cheap upfront, endless colours, quick to apply.<br /><strong>Watch out:</strong> humidity and rainy-season damp can cause bubbling and peeling. Walls near generators, kitchens and car parks pick up soot and marks, so repainting becomes a regular expense.</p>
<h2>POP and plaster designs</h2>
<p><strong>Good:</strong> excellent for ceilings, borders and coves, and very popular for sculpted TV walls.<br /><strong>Watch out:</strong> POP can crack with building movement and absorbs moisture if there is a leak. Repairs usually mean redoing the section.</p>
<h2>Wall panels (WPC, PVC, fluted, PU stone)</h2>
<p><strong>Good:</strong> factory-finished, no repainting, quick to install and consistent in look. Many panels stand up well to humidity and are easy to wipe clean. Wood-look panels are not attacked by termites the way real timber can be.<br /><strong>Watch out:</strong> choose the right product for the right place, and never install panels over a wall that is still damp.</p>
<h2>Cost thinking</h2>
<p>Paint is cheapest on day one, but repainting every couple of years adds up. Panels cost more at the start and save repeat work. For feature walls, reception areas, hotel lobbies, church foyers and shop interiors, panels often give the best long-term value.</p>
<h2>Which to use where</h2>
<ul>
<li><strong>Living-room TV wall:</strong> fluted WPC panels or PU stone with LED lighting.</li>
<li><strong>Bedroom headboard wall:</strong> WPC, upholstered panels or textured wallpaper.</li>
<li><strong>Office reception and boardroom:</strong> WPC or acoustic panels for a polished, quiet space.</li>
<li><strong>Kitchen, bathroom and laundry:</strong> PVC panels (away from the cooker).</li>
<li><strong>Ceilings:</strong> POP for custom shapes, PVC for a fast, clean finish.</li>
</ul>
<h2>Smart combination</h2>
<p>Many good interiors mix all three: neutral paint on most walls, one panel feature wall, and a POP or PVC ceiling with LED lighting. It keeps the budget sensible while the room still feels high-end.</p>
<p>Planning a new build or a refresh? Send us your measurements and we will recommend a mix that fits your budget.</p>`,
  },
  {
    title: 'Decorating for the Nigerian Climate: Heat, Harmattan Dust and Rainy Season',
    excerpt:
      'Heat, humidity, harmattan dust and heavy rain are tough on interiors. Choose materials and finishes that cope with Nigerian weather.',
    metaTitle: 'Interior Decor for Nigerian Weather: Heat, Dust & Rain',
    metaDescription:
      'Choose curtains, flooring, wall panels and finishes that handle Nigerian heat, harmattan dust and rainy-season humidity, with practical care tips.',
    keywords: ['interior decor Nigeria', 'harmattan dust home', 'humidity wall finish', 'curtains for hot weather Nigeria', 'durable flooring Nigeria'],
    categories: ['Decor Guides'],
    daysAgo: 4,
    html: `<p>Nigerian weather changes through the year: hot and humid for months, dry and dusty during harmattan, then heavy rain. Your interior finishes should cope with all of it.</p>
<h2>Heat and sunshine</h2>
<ul>
<li><strong>Curtains and blinds:</strong> choose lined or blackout fabric, or solar-style roller blinds, to cut glare and heat. This helps your AC or fan work less.</li>
<li><strong>Light colours</strong> on walls and ceilings bounce light and make rooms feel cooler.</li>
<li><strong>Fade-resistant fabrics</strong> last longer near sunny windows.</li>
</ul>
<h2>Harmattan dust</h2>
<ul>
<li>Pick <strong>washable</strong> curtains and easy-wipe wall finishes such as PVC and WPC panels.</li>
<li>Choose <strong>smooth or low-pile rugs</strong> that are easier to shake out and vacuum.</li>
<li>Close windows with <strong>layered curtains</strong> during the dry season and wipe sills often.</li>
<li>Dust fluted panel grooves with a soft brush.</li>
</ul>
<h2>Rainy season and humidity</h2>
<ul>
<li>Fix leaks and damp walls <strong>before</strong> any panel, wallpaper or tile goes up.</li>
<li>Pick <strong>moisture-friendly flooring</strong> such as SPC or good vinyl instead of untreated wood.</li>
<li>Avoid heavy natural fabrics in rooms that stay damp. They can hold odour.</li>
<li>Keep air moving. Ventilation protects furniture and fittings.</li>
</ul>
<h2>Power and noise</h2>
<p>With generators and inverters in many homes and offices, <strong>LED lighting</strong> saves power, and <strong>acoustic or fabric-covered panels</strong> help soften noise in the rooms nearest to them.</p>
<h2>A simple climate-smart checklist</h2>
<ol>
<li>Blackout or lined curtains in sun-facing rooms.</li>
<li>Wipeable wall finishes in busy and dusty areas.</li>
<li>SPC or vinyl flooring instead of untreated timber.</li>
<li>LED ceiling and accent lighting.</li>
<li>A dry, ventilated surface behind every panel and wallpaper.</li>
</ol>
<p>Tell us where you live and which rooms give you trouble, and we will recommend finishes that last.</p>`,
  },
  {
    title: '9ft by 4ft PVC Marble Sheet (3mm): Size, Uses and Installation Guide',
    excerpt:
      'A full-size 9ft by 4ft PVC marble sheet covers a wall with very few joints. Learn the real size and thickness to expect, where to use it, what to avoid and how to install it.',
    metaTitle: '9ft x 4ft PVC Marble Sheet (3mm): Uses, Size & Install',
    metaDescription:
      'Everything to know about the 9ft by 4ft 3mm PVC marble sheet: actual size, thickness, coverage, best rooms, limits, installation steps and care.',
    keywords: ['marble sheet', 'PVC marble sheet', 'UV marble sheet', '9ft by 4ft marble sheet', '3mm marble sheet', 'marble sheet for TV wall'],
    categories: ['Wall Panels', 'Decor Guides'],
    daysAgo: 0,
    featured: true,
    html: `<p>The <strong>PVC marble sheet</strong>, also called a <strong>UV marble sheet</strong>, has become one of the most popular wall finishes for TV walls, bathrooms and shop interiors. The full-size <strong>9ft by 4ft</strong> version is especially loved because one sheet covers a large section of wall with very few joints. This guide explains what it is, what size and thickness to expect, where it works, where it does not, and how to fit it.</p>
<h2>What is a PVC marble sheet?</h2>
<p>It is a rigid, thin PVC board with a printed marble pattern and a glossy UV-cured coating on the surface. The coating gives the high-shine look of polished marble, helps the surface resist scratches and keeps the colour from fading. It is a decorative wall finish, not real stone and not a structural material.</p>
<h2>Size, thickness and coverage: what to expect</h2>
<ul>
<li><strong>Width:</strong> about 1.22 m (4ft).</li>
<li><strong>Height:</strong> a "9ft" sheet is usually sold at around 2.8 m (about 110 inches). Some suppliers cut slightly different lengths, such as 2.9 m, so the exact size varies.</li>
<li><strong>Coverage:</strong> roughly 3.3 to 3.4 square metres per full sheet.</li>
<li><strong>Thickness:</strong> sold as "3mm", but listings differ. Some sheets of this size are stated at 2.8mm, and others at 3mm with a small tolerance.</li>
<li><strong>Weight:</strong> light enough for two people to carry. One manufacturer lists about 4.5 to 5.5 kg per square metre for 3mm sheets, which means roughly 15 to 19 kg for a full 9ft sheet.</li>
</ul>
<p><strong>Tip:</strong> do not assume. Ask the supplier for the exact length, width and thickness, and measure the sheets with a tape when they arrive, before you cut or glue anything.</p>
<h2>Where a marble sheet works well</h2>
<ul>
<li><strong>TV and feature walls</strong> in living rooms</li>
<li><strong>Bathrooms and shower walls</strong>, because the surface is non-porous and wipes clean</li>
<li><strong>Kitchen splashbacks and sink areas</strong>, away from direct heat</li>
<li><strong>Reception desks and lobby walls</strong> in offices and hotels</li>
<li><strong>Salons, restaurants, shops and showrooms</strong> that want a luxury look on a sensible budget</li>
<li><strong>Fireplace-style wall features</strong> that are decorative only</li>
</ul>
<h2>Where not to use it</h2>
<ul>
<li><strong>Outdoors and exterior walls.</strong> These sheets are made for interior use.</li>
<li><strong>Floors.</strong> They are wall finishes, not flooring.</li>
<li><strong>Right next to a cooker, stove or open flame.</strong> One manufacturer rates its sheet for heat up to about 93 degrees Celsius, which is fine for a kitchen wall but not for direct contact with hot cookware or flames.</li>
<li><strong>Damp or crumbling walls.</strong> Fix the damp first.</li>
</ul>
<h2>Marble sheet vs real marble</h2>
<p>Real marble is heavy, expensive and needs skilled fitting and sealing. A PVC marble sheet gives a similar polished look at a far lower weight, installs in hours instead of days and needs no grout. You give up the natural variation and the feel of real stone, so it suits people who want the look rather than the material.</p>
<h2>What you need to install it</h2>
<ul>
<li>Construction or panel adhesive recommended by your supplier</li>
<li>Tape measure, pencil, spirit level and a straight edge</li>
<li>Utility knife or fine-tooth saw, depending on the sheet</li>
<li>Notched trowel or adhesive gun</li>
<li>Matching silicone sealant for seams and edges, and trims where needed</li>
</ul>
<h2>How to install a full-size sheet</h2>
<ol>
<li><strong>Prepare the wall.</strong> It must be clean, dry, flat and firm. Remove loose paint and dust and repair holes.</li>
<li><strong>Measure and mark.</strong> Check the wall height against the sheet length and mark cut lines and socket positions.</li>
<li><strong>Dry-fit first.</strong> Hold the sheet up to confirm the fit before applying adhesive.</li>
<li><strong>Apply adhesive.</strong> Run a bead along the edges, about 1 cm in from the border, then add zigzag lines across the middle, spaced a few inches apart.</li>
<li><strong>Position and press.</strong> With a helper, place the sheet from the bottom, align it to your level line and press firmly across the whole surface.</li>
<li><strong>Finish the joints.</strong> Seal seams and edges with matching silicone or cover them with a trim. In wet areas, seal carefully.</li>
<li><strong>Allow it to cure</strong> as the adhesive instructions say.</li>
</ol>
<p>A single wall typically takes only a few hours once the surface is ready.</p>
<h2>Handling a 9ft sheet</h2>
<p>A sheet this long is awkward in tight stairwells and small cars. Carry it on its long edge with two people, keep it flat during transport so it does not bend, and plan your route through doors before you collect it. Cut with the finished side up and support the sheet fully while cutting.</p>
<h2>Care and cleaning</h2>
<p>Wipe with a damp cloth and a little mild soap. Avoid abrasive pads, harsh solvents and scrubbing powders, which can dull the gloss. Wipe water splashes dry in bathrooms to keep the shine.</p>
<h2>Quick buying checklist</h2>
<ol>
<li>Confirm the <strong>exact size and thickness</strong>.</li>
<li>Ask if the sheet is <strong>interior-use only</strong> and what it is rated for.</li>
<li>Check the <strong>surface for scratches</strong> and look at several sheets for colour and vein match.</li>
<li>Buy <strong>one or two extra sheets</strong> if your wall needs cuts, because later batches may not match exactly.</li>
<li>Ask about the right <strong>adhesive, sealant and trims</strong>.</li>
</ol>
<p>Send us your wall size and we will help you work out how many sheets you need and recommend a design.</p>`,
  },
];

/** "In Nigeria" notes: local context appended to every article (before the closing call-to-action). */
const NG_NOTES: Record<string, string> = {
  '9ft by 4ft PVC Marble Sheet (3mm): Size, Uses and Installation Guide':
    '<p>Marble sheet sizes sold in Nigeria are not all the same. Common listings include about 1.2 m by 2.9 m and 1.2 m by 2.4 m, as well as the 9ft by 4ft size, so always confirm the length and thickness before you order and measure on delivery. The glossy surface wipes clean of harmattan dust and bathroom humidity, which makes it popular for TV walls, salons, shops and bathrooms. Keep it for interior walls, and do not fit it over a damp wall after the rains.</p>',
  'WPC Wall Panels: A Practical Buyer Guide':
    '<p>Panels that look like timber but are not attacked by termites are a real advantage in Nigeria, and the lighter weight helps on blockwork and on upper floors of duplexes and estates. Always confirm that a panel is rated for indoor use before putting it in a room, and keep outdoor-rated products for balconies and open areas exposed to rain and strong sun.</p>',
  'Fluted Wall Panels: How to Style, Light and Install Them':
    '<p>Fluted panels are a favourite for living-room TV walls, church foyers, hotel lobbies and office receptions in Lagos, Abuja and Port Harcourt. Pair them with LED strips, which also use less power on inverter or generator supply, and make sure the wall is fully dry after the rains before you install.</p>',
  'SPC vs WPC vs Vinyl Flooring: Which Should You Choose?':
    '<p>In Nigerian homes, flooring faces dust, sudden rain, heavy foot traffic and furniture that gets moved often. SPC is a strong pick for living areas, shops and offices, while vinyl suits rental apartments and quick refits. Check that the surface under any floor is level and dry, and buy a little extra from the same batch because designs may not match on a later restock.</p>',
  'Acoustic Wall Panels: Quieter Rooms Without Losing Style':
    '<p>Between street noise, neighbours, generators and busy open-plan offices, many Nigerian spaces are noisy. Acoustic panels work well in offices, recording rooms, classrooms, restaurants, event halls and worship centres, and in rooms nearest the generator house. They reduce echo inside the room, so pair them with proper sealing if you also need to block noise from outside.</p>',
  'Flexible Stone and Ceramic Tile: Natural Looks, Lighter Weight':
    '<p>Lightweight cladding is useful on estate perimeter walls, gate pillars, shop fronts and restaurants where real stone would be heavy and costly to transport. For outdoor surfaces exposed to Nigerian sun and rain, ask specifically for an exterior-rated product.</p>',
  'How to Clean and Care for Wall Panels and Flooring':
    '<p>During harmattan, dust settles quickly, so wipe panels and mop floors more often. In the rainy season, keep entrances dry with mats to stop mud and water being tracked in, and dry any spills straight away.</p>',
  'PVC Wall Panels: Pros, Cons and Where They Work Best':
    '<p>PVC panels are popular in Nigeria for bathrooms, kitchens, shops, salons, schools and rented flats where landlords and tenants want a clean finish at a sensible price. They are also widely used on ceilings. Make sure you treat any damp or leak first, because trapped moisture behind a panel can lead to mould.</p>',
  'PU Stone Wall Panels: Get the Stone Look Without the Weight':
    '<p>PU stone is a hit for Nigerian gate houses, compound walls, entrances, hotel lobbies, restaurants and living-room feature walls. Choose UV-stable, exterior-rated panels for anything that faces sun and rain, and keep them clear of open flame.</p>',
  'How to Choose Curtains: Fabric, Length, Colour and Fit':
    '<p>In Nigeria, curtains need to handle strong sun, dust and heat, so lined or blackout fabric is a smart buy for sun-facing rooms. Many Nigerian homes use double layers: sheers during the day for soft light and heavier curtains at night. Choose washable fabric for harmattan season, and remember that generator or AC noise is softened by thick, full curtains.</p>',
  'Roller, Roman and Zebra Blinds: Which Blind Is Right for You?':
    '<p>Roller and zebra blinds are very popular in Nigerian offices, apartments and shops because they control glare and heat without taking up space. In dusty areas pick smooth, wipeable fabrics, and consider blackout fabric for bedrooms where you sleep during the day or need darkness during power cuts.</p>',
  'Wallpaper Ideas: How to Choose, Style and Apply Wallpaper':
    '<p>Wallpaper needs a dry, sound wall. In humid Nigerian conditions, fix leaks first, prime the wall and choose vinyl-coated or washable wallpaper for busy rooms. Buy all rolls from the same batch, because colour can vary between batches.</p>',
  'Ceiling and Lighting Ideas to Lift Any Room':
    '<p>POP ceilings with cove lighting are a Nigerian favourite, and PVC ceiling panels are a clean, quick alternative. Choose energy-saving LED lights, which are easier on generators and inverters, and ask about dimmers and warm-white options for a relaxed evening feel.</p>',
  'Sofa and Upholstery Fabrics: How to Pick Fabric That Lasts':
    '<p>Nigerian heat and dust affect sofas, so breathable, easy-to-clean fabrics are worth the choice. Choose tightly woven or performance fabrics for family homes, and keep sofas out of direct afternoon sun to prevent fading.</p>',
  'Wall Panels vs Paint vs POP: What Works Best in Nigerian Homes':
    '',
  'Decorating for the Nigerian Climate: Heat, Harmattan Dust and Rainy Season':
    '',
};

function withNigeriaNote(title: string, html: string): string {
  const note = NG_NOTES[title];
  if (!note) return html;
  const i = html.lastIndexOf('<p>');
  return html.slice(0, i) + '<h2>In Nigeria</h2>\n' + note + '\n' + html.slice(i);
}

/** Internal links: strong SEO signal and keeps readers moving through the site. */
function relatedSection(self: Seed): string {
  const mine = new Set(self.categories);
  const picks = ARTICLES.filter((o) => o !== self)
    .map((o) => ({ o, score: o.categories.filter((c) => mine.has(c)).length }))
    .sort((a, b) => b.score - a.score || a.o.daysAgo - b.o.daysAgo)
    .slice(0, 3)
    .map(({ o }) => `<li><a href="/articles/${slugify(o.title)}">${o.title}</a></li>`)
    .join('');
  return `<h2>Related guides</h2><ul>${picks}</ul><p>Have questions? <a href="/about">Contact Nasuru Interiors</a> for a free quote, or <a href="/articles">browse all our guides</a>.</p>`;
}

function checkSeo(a: Seed) {
  const warn: string[] = [];
  if (a.metaTitle.length > 60) warn.push(`metaTitle ${a.metaTitle.length}>60`);
  if (a.metaDescription.length < 110 || a.metaDescription.length > 160) warn.push(`metaDescription ${a.metaDescription.length}`);
  if (/[—–]|&mdash;|&ndash;/.test(a.html + a.title + a.excerpt + a.metaTitle + a.metaDescription)) warn.push('contains dash character');
  if (warn.length) console.warn(`  ! ${a.title}: ${warn.join(', ')}`);
}

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
    checkSeo(a);
    const withNote = withNigeriaNote(a.title, a.html);
    // Replace the plain closing call-to-action with related links and a linked call-to-action.
    const html = withNote.slice(0, withNote.lastIndexOf('<p>')) + relatedSection(a);
    const keywords = [...new Set([...a.keywords, 'Nigeria', 'Lagos'])];
    const publishedAt = new Date(Date.now() - a.daysAgo * 86_400_000).toISOString();
    const rows = await sql`
      INSERT INTO public.articles
        (slug, title, excerpt, content_html, meta_title, meta_description, keywords,
         status, featured, author, reading_minutes, published_at)
      VALUES
        (${slug}, ${a.title}, ${a.excerpt}, ${html}, ${a.metaTitle}, ${a.metaDescription},
         ${keywords}, 'published', ${a.featured ?? false}, 'Nasuru Interiors',
         ${estimateReadingMinutes(html)}, ${publishedAt})
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
