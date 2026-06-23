const blog1 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/blogimg1.webp";
const blog2 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/worker.webp";
const blog3 = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/woodenfloor.webp";

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
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto">
  {/* Header */}
  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12">
    <div className="flex items-center gap-2">
      <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
      <span
        className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        More Posts
      </span>
    </div>

    <h2
      className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#0d2138] text-center leading-[36px] sm:leading-[42px] lg:leading-tight max-w-[500px]"
      style={{ fontFamily: "Poppins, sans-serif" }}
    >
      Continue Reading
    </h2>
  </div>

  {/* Grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
    {posts.map((post) => (
      <div key={post.id} className="flex min-w-0 flex-col gap-4 sm:gap-[19px]">
        {/* Image */}
        <div className="relative h-[220px] sm:h-[250px] lg:h-[296px] rounded-[18px] sm:rounded-[20px] overflow-hidden">
          <img
            src={post.img}
            alt={post.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
            <span
              className="bg-white/90 px-3 py-1 rounded-[36px] text-[12px] sm:text-[13px] text-[#0d2138]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              {post.category}
            </span>
          </div>
        </div>

        {/* Meta */}
        <div className="flex min-w-0 flex-col gap-2">
          <div
            className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] sm:text-[14px] text-[#2b3038]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            <span>{post.date}</span>
            <div className="w-1 h-1 rounded-full bg-[#2b3038]" />
            <span>{post.author}</span>
          </div>

          <h3
            className="text-[17px] sm:text-[18px] lg:text-[20px] font-medium text-[#0d2138] leading-[27px] sm:leading-[30px] lg:leading-[32px] line-clamp-2"
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
