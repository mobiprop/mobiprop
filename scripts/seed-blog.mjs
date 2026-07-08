// One-off: seed the blog with the posts the marketing site previously rendered
// as static content, so the DB starts with real, editable data. Idempotent —
// re-running skips slugs that already exist (safe to run more than once).
// Run: node --env-file=.env scripts/seed-blog.mjs
import crypto from "node:crypto";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL });

const IMG = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal";
const COVERS = [`${IMG}/blogimg1.webp`, `${IMG}/worker.webp`, `${IMG}/woodenfloor.webp`];

// Builds a reasonable rich-text (Tiptap-compatible) HTML body from a few parts.
function body({ intro, sections, closing }) {
  const secHtml = sections
    .map(
      (s) =>
        `<h2>${s.heading}</h2><p>${s.paras.join("</p><p>")}</p>` +
        (s.bullets ? `<ul>${s.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>` : ""),
    )
    .join("");
  return `<p>${intro}</p>${secHtml}<h2>Final thoughts</h2><p>${closing}</p>`;
}

const POSTS = [
  {
    slug: "future-of-sustainable-architecture",
    title: "The Future of Sustainable Architecture: Trends to Watch in 2025",
    category: "Architecture",
    author: "Jane Li",
    date: "2025-06-09",
    excerpt: "From passive design to smart materials, here are the sustainability trends reshaping how homes are built and valued.",
    content: body({
      intro:
        "Sustainability has moved from a nice-to-have to a core expectation for buyers and developers alike. In 2025, the most desirable properties are the ones designed to consume less, last longer, and adapt to their environment.",
      sections: [
        {
          heading: "Passive design comes first",
          paras: [
            "Before adding technology, the best projects get the fundamentals right: orientation, insulation, cross-ventilation, and shading. A well-oriented home stays comfortable with a fraction of the energy.",
          ],
          bullets: ["Optimised orientation and glazing", "High-performance insulation", "Natural cross-ventilation"],
        },
        {
          heading: "Smart materials and systems",
          paras: [
            "Low-carbon concrete, engineered timber, and recycled finishes reduce a building's footprint without compromising on design. Paired with solar and efficient HVAC, they cut running costs for years.",
          ],
        },
      ],
      closing:
        "Sustainable architecture is no longer a premium niche — it's becoming the baseline. Homes built with these principles hold their value and cost less to live in.",
    }),
  },
  {
    slug: "minimalist-interiors-luxury-living",
    title: "How Minimalist Interiors Are Redefining Luxury Living Spaces",
    category: "Interior",
    author: "Mark Davis",
    date: "2025-07-14",
    excerpt: "Luxury today is about space, light, and calm — not clutter. Here's how minimalism became the new premium.",
    content: body({
      intro:
        "The definition of luxury has shifted. Where opulence once meant more, today's high-end interiors are defined by restraint, quality materials, and a sense of calm.",
      sections: [
        {
          heading: "Space is the ultimate luxury",
          paras: [
            "Open layouts, generous ceiling heights, and uncluttered surfaces make a home feel expansive. Buyers increasingly pay a premium for that sense of breathing room.",
          ],
        },
        {
          heading: "Fewer, better materials",
          paras: [
            "Natural stone, warm timber, and honest finishes do more with less. A carefully chosen palette reads as far more expensive than a busy one.",
          ],
        },
      ],
      closing: "Minimalism isn't about emptiness — it's about intention. That's exactly why it feels so luxurious.",
    }),
  },
  {
    slug: "top-5-investment-locations-2025",
    title: "Top 5 Investment Locations for Property Buyers in 2025",
    category: "Real Estate",
    author: "Sara Kim",
    date: "2025-08-03",
    excerpt: "Where should you put your money this year? These five markets combine strong demand with room to grow.",
    content: body({
      intro:
        "Location still drives returns more than any other factor. The strongest opportunities in 2025 share a common thread: growing populations, improving infrastructure, and supply that hasn't yet caught up with demand.",
      sections: [
        {
          heading: "What makes a location investable",
          paras: ["Look beyond today's price. The best markets show momentum across several leading indicators."],
          bullets: [
            "Population and employment growth",
            "New transport and infrastructure",
            "Rental demand outpacing supply",
            "Planned commercial development",
          ],
        },
      ],
      closing: "Do the homework on fundamentals, and let the numbers — not the hype — guide where you buy.",
    }),
  },
  {
    slug: "natural-light-modern-architecture",
    title: "The Role of Natural Light in Modern Architectural Design",
    category: "Design",
    author: "Tom Allen",
    date: "2025-09-22",
    excerpt: "Daylight is the cheapest, most powerful design tool there is. Here's how great homes use it.",
    content: body({
      intro:
        "Natural light shapes how a space feels more than almost any finish or furnishing. Get it right and a room feels larger, healthier, and more inviting.",
      sections: [
        {
          heading: "Designing for the sun",
          paras: [
            "Thoughtful window placement, skylights, and open sightlines let light move through a home over the course of the day, reducing the need for artificial lighting.",
          ],
        },
      ],
      closing: "Homes that make the most of daylight are more pleasant to live in — and consistently more desirable.",
    }),
  },
  {
    slug: "sustainable-materials-home-construction",
    title: "Why Sustainable Materials Are the Future of Home Construction",
    category: "Investment",
    author: "Priya Patel",
    date: "2025-10-05",
    excerpt: "Greener materials aren't just good for the planet — they're increasingly good for resale value too.",
    content: body({
      intro:
        "The materials a home is built from increasingly influence both its environmental footprint and its long-term value. Buyers are paying attention.",
      sections: [
        {
          heading: "The value case for going green",
          paras: [
            "Efficient, durable materials lower maintenance and energy costs while appealing to a growing segment of environmentally conscious buyers.",
          ],
        },
      ],
      closing: "Building sustainably is quickly becoming the smart financial choice, not just the ethical one.",
    }),
  },
  {
    slug: "property-market-cycles-investment",
    title: "Understanding Property Market Cycles for Smarter Investment",
    category: "Lifestyle",
    author: "Luis Gomez",
    date: "2025-11-18",
    excerpt: "Markets move in cycles. Knowing where you are in the cycle is the difference between a good deal and a great one.",
    content: body({
      intro:
        "Real estate moves through recognisable phases — recovery, expansion, hyper-supply, and recession. Understanding these cycles helps you time decisions with confidence.",
      sections: [
        {
          heading: "Reading the signals",
          paras: ["Vacancy rates, construction activity, and price momentum all hint at where a market sits in its cycle."],
        },
      ],
      closing: "You can't perfectly time the market, but understanding its rhythm keeps you from buying at the peak.",
    }),
  },
  {
    slug: "aesthetics-functionality-open-plan-living",
    title: "Balancing Aesthetics and Functionality in Open-Plan Living",
    category: "Architecture",
    author: "Amy Chen",
    date: "2025-12-01",
    excerpt: "Open-plan living looks great in photos — but making it work day to day takes careful design.",
    content: body({
      intro:
        "Open-plan layouts remain hugely popular, but the best ones balance a sense of openness with the zones people actually need to live comfortably.",
      sections: [
        {
          heading: "Defining zones without walls",
          paras: ["Rugs, lighting, and furniture placement can separate cooking, dining, and living areas while keeping the space connected."],
        },
      ],
      closing: "Great open-plan design feels effortless — but it's the result of deliberate choices about flow and function.",
    }),
  },
  {
    slug: "location-shapes-property-value",
    title: "How Location Shapes Property Value Over the Long Term",
    category: "Interior",
    author: "Ben Foster",
    date: "2026-01-12",
    excerpt: "You can renovate a home, but you can't move it. Why location remains the single biggest driver of value.",
    content: body({
      intro:
        "Of all the factors that influence a property's value, location is the one you can't change. It's why two similar homes can differ dramatically in price.",
      sections: [
        {
          heading: "What buyers really pay for",
          paras: ["Access to schools, transport, amenities, and safe, walkable streets consistently commands a premium."],
        },
      ],
      closing: "Invest in the right location and the property tends to take care of the rest over time.",
    }),
  },
  {
    slug: "designing-for-wellness-home-building",
    title: "Designing for Wellness — The New Standard in Home Building",
    category: "Real Estate",
    author: "Nora Webb",
    date: "2026-02-28",
    excerpt: "Air quality, light, and calm are becoming as important as square metres. Welcome to wellness-first design.",
    content: body({
      intro:
        "Homes are increasingly designed around the wellbeing of the people who live in them — a shift accelerated by how much time we now spend indoors.",
      sections: [
        {
          heading: "The pillars of a healthy home",
          paras: ["Clean air, abundant daylight, quiet spaces, and connection to nature all contribute to how a home feels."],
          bullets: ["Improved ventilation and air quality", "Access to natural light", "Quiet, restful zones"],
        },
      ],
      closing: "Wellness-focused design is fast becoming an expectation — and a genuine differentiator in the market.",
    }),
  },
];

let added = 0;
let skipped = 0;

for (const p of POSTS) {
  const { rowCount } = await pool.query(`select 1 from blog_posts where slug = $1`, [p.slug]);
  if (rowCount > 0) {
    console.log(`- skip "${p.slug}" (already exists)`);
    skipped++;
    continue;
  }

  const publishedAt = new Date(`${p.date}T09:00:00.000Z`);
  const id = crypto.randomUUID();
  const cover = COVERS[added % COVERS.length];

  await pool.query(
    `insert into blog_posts
       (id, slug, title, category, excerpt, content, cover_image_url, author, status, published_at, created_at, updated_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9::"BlogStatus", $10, $10, now())`,
    [id, p.slug, p.title, p.category, p.excerpt, p.content, cover, p.author, "PUBLISHED", publishedAt],
  );

  console.log(`✓ published "${p.title}"`);
  added++;
}

console.log(`\nDone. Added ${added}, skipped ${skipped} (already present).`);
await pool.end();
