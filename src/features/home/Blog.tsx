const blog1 = "/assets/figma-temp/HomePageFinal/7c82e56c163d6893884fa4c288282f579864c318.png";
const blog2 = "/assets/figma-temp/HomePageFinal/0beaacc973efa4b7f5e6e3f2de99d91d8b09a059.png";
const blog3 = "/assets/figma-temp/HomePageFinal/bb08db275c087bf33642542868d841ab9b84f80f.png";

const posts = [
  {
    id: 1,
    img: blog1,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
  },
  {
    id: 2,
    img: blog2,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
  },
  {
    id: 3,
    img: blog3,
    category: "Architecture",
    date: "Jun 9, 2025",
    author: "JANE LI",
    title: "Discover how smart design transforms daily life for the better",
  },
];

export function Blog() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              More Posts
            </span>
          </div>
          <h2
            className="text-[32px] lg:text-[44px] font-semibold text-[#0d2138] text-center leading-tight max-w-[500px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Continue Reading
          </h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-col gap-[19px]">
              {/* Image */}
              <div className="relative h-[240px] lg:h-[296px] rounded-[20px] overflow-hidden">
                <img
                  src={post.img}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span
                    className="bg-white opacity-90 px-3 py-1 rounded-[36px] text-[13px] text-[#0d2138]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    {post.category}
                  </span>
                </div>
              </div>

              {/* Meta */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-[13px] text-[#2b3038]" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  <span>{post.date}</span>
                  <div className="w-1 h-1 rounded-full bg-[#2b3038]" />
                  <span>{post.author}</span>
                </div>
                <h3
                  className="text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[32px] line-clamp-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {post.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
