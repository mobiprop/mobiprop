import Link from "next/link";

const heroBg = "/assets/figma-temp/SingleBlogPage/hero-bg.png";
const heroBgOverlay = "/assets/figma-temp/SingleBlogPage/hero-bg-overlay.png";
const articleHeroImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleBlogPage/article-hero-img.png";
const articleSectionImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/SingleBlogPage/article-section-img.png";
const blogCardImg1 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.png";
const blogCardImg2 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.png";
const blogCardImg3 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.png";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

/* ─── types ─── */
interface BlogPost {
  slug: string;
  title: string;
  date: string;
  author: string;
  category: string;
  heroImg: string;
  intro: string;
  sections: { heading: string; body: string }[];
  conclusion: { heading: string; body: string[] };
  sectionImg?: string;
}

/* ─── placeholder article data ─── */
const DEMO_POST: BlogPost = {
  slug: "future-of-sustainable-architecture",
  title: "The Future of Sustainable Architecture: Trends to Watch in 2025",
  date: "March 5, 2025",
  author: "Jane Li",
  category: "Architecture",
  heroImg: articleHeroImg,
  sectionImg: articleSectionImg,
  intro:
    "In today's fast-paced work environment, efficiency is the key to success. Teams that manage their tasks effectively are more productive, deliver better results, and experience less stress. However, managing workflows manually, juggling multiple tools, and keeping track of project progress can be overwhelming. That's where TomoSaaS comes in.",
  sections: [
    {
      heading: "1. Centralized Task Management for Seamless Workflow",
      body: "Create, Assign, and Track Tasks Efficiently – Team members can assign tasks, set deadlines, and track progress in a structured manner. Use Multiple Views (Kanban, List, Calendar, Gantt) – Every team has different workflows, and TomoSaaS provides multiple task management layouts that cater to various needs. Set Task Priorities & Reminders – Ensure that important tasks are completed first while staying on top of deadlines. With a user-friendly dashboard, teams can visualize their workload in real-time and ensure nothing falls through the cracks.",
    },
    {
      heading: "2. Real-Time Collaboration – Stay Connected & Productive",
      body: "Effective communication is critical for teamwork, especially in remote or hybrid work environments. TomoSaaS ensures that team members can stay connected and aligned through:\n\nBuilt-in Team Chat & Discussion Threads – No more scattered conversations across different platforms. Keep task-related discussions organized within each project. @Mentions & Notifications – Instantly notify relevant team members about updates, changes, or urgent matters. File Sharing & Document Collaboration – Upload, edit, and comment on shared files directly in TomoSaaS without switching between apps. Activity Feeds & Audit Trails – Track project changes in real-time, ensuring transparency and accountability.",
    },
    {
      heading: "3. Smart Automation – Minimize Manual Work, Maximize Productivity",
      body: "Repetitive tasks can be a huge drain on productivity. TomoSaaS eliminates these inefficiencies with smart automation features, allowing teams to:\n\nAutomate Recurring Tasks – Set up automatic task creation for repetitive workflows, eliminating the need for manual input. Workflow Automation – Automatically move tasks between different statuses based on predefined conditions. AI-Powered Task Prioritization – Let TomoSaaS analyze deadlines and workload distribution to suggest priorities. Deadline & Reminder Automation – Never miss a deadline with automatic notifications sent to responsible team members.",
    },
    {
      heading: "4. Seamless Integration with Third-Party Tools",
      body: "Modern teams use multiple tools daily. Instead of switching between different platforms, TomoSaaS integrates seamlessly with essential third-party apps, including:\n\nSlack & Microsoft Teams – Stay updated with task notifications and discussions in your preferred communication app. Google Drive & Dropbox – Store and share files directly from cloud storage solutions. Notion, Evernote & Confluence – Sync knowledge bases and documentation effortlessly. Zapier & API Access – Automate workflows with custom integrations to thousands of apps.",
    },
  ],
  conclusion: {
    heading: "Conclusion",
    body: [
      "TomoSaaS is more than just a task management tool – it's a complete productivity solution designed to help teams work smarter, not harder. By offering centralized task management, real-time collaboration, powerful automation, seamless integrations, data-driven insights, and enterprise-grade security, TomoSaaS empowers teams to achieve higher efficiency with less effort.",
      "If your team is looking to streamline workflows, enhance collaboration, and automate tedious tasks, TomoSaaS is the perfect solution. Try it today and take your productivity to the next level!",
    ],
  },
};

/* ─── continue reading posts ─── */
const CONTINUE_READING = [
  {
    id: 1,
    img: blogCardImg1,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
    slug: "smart-design-transforms-daily-life",
  },
  {
    id: 2,
    img: blogCardImg2,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
    slug: "smart-design-transforms-daily-life-2",
  },
  {
    id: 3,
    img: blogCardImg3,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
    slug: "smart-design-transforms-daily-life-3",
  },
];

/* ─── SectionTag ─── */
function SectionTag({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-[7px] h-[7px] rounded-full bg-[#4896b6] shrink-0" />
      <span
        className="text-[16px] font-medium leading-[24px] tracking-[-0.16px]"
        style={{ fontFamily: montserrat, color: muted ? "#6a7282" : "#2b3038" }}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── BlogCard (reused in Continue Reading) ─── */
function BlogCard({ post }: { post: (typeof CONTINUE_READING)[number] }) {
  return (
    <Link href={`/blog/${post.slug}`} className="flex flex-col gap-5 group cursor-pointer">
      <div className="relative h-[296px] rounded-[20px] overflow-hidden shrink-0">
        <img
          src={post.img}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <span
          className="absolute top-4 left-4 bg-white/90 rounded-[36px] px-3 py-1 text-[14px] text-[#0d2138] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          {post.category}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center text-[14px] text-[#2b3038] tracking-[-0.14px]"
          style={{ fontFamily: montserrat }}
        >
          <span className="whitespace-nowrap">{post.date}</span>
          <span className="w-[5px] h-[5px] rounded-full bg-[#2b3038] mx-2 shrink-0" />
          <span className="whitespace-nowrap">{post.author}</span>
        </div>
        <h3
          className="text-[20px] font-medium text-[#0d2138] leading-[32px] tracking-[-0.2px] line-clamp-2"
          style={{ fontFamily: poppins }}
        >
          {post.title}
        </h3>
      </div>
    </Link>
  );
}

/* ─── Hero banner ─── */
function HeroBanner() {
  return (
    <section className="relative h-[360px] lg:h-[408px] overflow-hidden border-b border-black/10">
      <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <img
        src={heroBgOverlay}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(167,189,221,0.97) 0%, rgba(255,255,255,0.77) 45%, white 63%)",
        }}
      />
      <div className="relative h-full flex flex-col items-center justify-center gap-3 px-6 text-center">
        <SectionTag label="Blog Post" />
        <h1
          className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.44px] max-w-[644px]"
          style={{ fontFamily: poppins }}
        >
          Our Blog Posts
        </h1>
        <p
          className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px] max-w-[560px]"
          style={{ fontFamily: montserrat }}
        >
          Explore our latest blog posts, where we share insights, market trends, and thoughtful
          perspectives on real estate.
        </p>
      </div>
    </section>
  );
}

/* ─── Section body — splits multi-para on \n\n with tighter inner gap ─── */
function SectionBody({ text }: { text: string }) {
  const paras = text.split("\n\n");
  if (paras.length === 1) {
    return (
      <p
        className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
        style={{ fontFamily: montserrat }}
      >
        {text}
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-[10px]">
      {paras.map((para, i) => (
        <p
          key={i}
          className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          {para}
        </p>
      ))}
    </div>
  );
}

/* ─── Article body ─── */
function ArticleContent({ post }: { post: BlogPost }) {
  const sectionImg = post.sectionImg ?? articleSectionImg;

  return (
    <article className="flex flex-col gap-12 lg:gap-[48px]">
      {/* header: back + date + title — w-[866px] per Figma */}
      <div className="flex flex-col gap-6 lg:gap-[24px] max-w-[866px]">
        <Link
          href="/blog"
          className="flex items-center gap-3 text-[16px] text-[#0d2138] tracking-[-0.16px] w-fit"
          style={{ fontFamily: montserrat }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="shrink-0">
            <path
              d="M19 12H5M5 12L12 19M5 12L12 5"
              stroke="#0d2138"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Link>

        <div className="flex flex-col gap-[14px]">
          <p
            className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
            style={{ fontFamily: montserrat }}
          >
            {post.date}
          </p>
          <h2
            className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.44px]"
            style={{ fontFamily: poppins }}
          >
            {post.title}
          </h2>
        </div>
      </div>

      {/* introduction */}
      <div className="flex flex-col gap-[20px]">
        <h3
          className="text-[28px] font-medium text-[#0d2138] leading-[36px] tracking-[-0.28px]"
          style={{ fontFamily: poppins }}
        >
          Introduction
        </h3>
        <p
          className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          {post.intro}
        </p>
      </div>

      {/* full-width hero image */}
      <div className="h-[400px] lg:h-[720px] rounded-[20px] overflow-hidden w-full">
        <img src={post.heroImg} alt="" className="w-full h-full object-cover" />
      </div>

      {/* sections + section image + conclusion — gap-[40px] between all children */}
      <div className="flex flex-col gap-10 lg:gap-[40px]">

        {/* section 1 only */}
        <div className="flex flex-col gap-[20px]">
          <h3
            className="text-[28px] font-semibold text-[#0d2138] leading-[36px] tracking-[-0.28px]"
            style={{ fontFamily: poppins }}
          >
            {post.sections[0].heading}
          </h3>
          <SectionBody text={post.sections[0].body} />
        </div>

        {/* section image between section 1 and section 2 per Figma */}
        <div className="h-[320px] lg:h-[512px] rounded-[20px] overflow-hidden w-full">
          <img src={sectionImg} alt="" className="w-full h-full object-cover" />
        </div>

        {/* sections 2-N + conclusion */}
        <div className="flex flex-col gap-10 lg:gap-[40px]">
          {post.sections.slice(1).map((section, i) => (
            <div key={i} className="flex flex-col gap-[20px]">
              <h3
                className="text-[28px] font-semibold text-[#0d2138] leading-[36px] tracking-[-0.28px]"
                style={{ fontFamily: poppins }}
              >
                {section.heading}
              </h3>
              <SectionBody text={section.body} />
            </div>
          ))}

          {/* conclusion */}
          <div className="flex flex-col gap-[20px]">
            <h3
              className="text-[28px] font-semibold text-[#0d2138] leading-[36px] tracking-[-0.28px]"
              style={{ fontFamily: poppins }}
            >
              {post.conclusion.heading}
            </h3>
            <div className="flex flex-col gap-[10px]">
              {post.conclusion.body.map((para, i) => (
                <p
                  key={i}
                  className="text-[16px] text-[#2b3038] leading-[24px] tracking-[-0.16px]"
                  style={{ fontFamily: montserrat }}
                >
                  {para}
                </p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Continue Reading ─── */
function ContinueReading() {
  return (
    <section className="flex flex-col gap-11 lg:gap-[44px] items-center">
      <div className="flex flex-col gap-2 items-center">
        <SectionTag label="More Posts" muted />
        <h2
          className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] leading-[1.25] lg:leading-[56px] tracking-[-0.44px] text-center"
          style={{ fontFamily: poppins }}
        >
          Continue Reading
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 w-full">
        {CONTINUE_READING.map((post) => (
          <BlogCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}

/* ─── main export ─── */
export function SingleBlogPageContent() {
  const post = DEMO_POST;

  return (
    <>
      <HeroBanner />

      <div className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-[60px] pb-16 lg:pb-20">
        <div className="flex flex-col gap-[68px]">
          <ArticleContent post={post} />
          <ContinueReading />
        </div>
      </div>
    </>
  );
}
