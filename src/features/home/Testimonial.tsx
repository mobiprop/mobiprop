import svgPaths from "@/assets/svg-6s7nojygyu";

const testimonialPerson = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/jay.png";

function QuoteIcon() {
  return (
    <svg width="72" height="60" viewBox="0 0 81.2621 67.125" fill="none">
      <g clipPath="url(#clip0_testimonial)">
        <path d={svgPaths.p39af8780} fill="#6A7282" opacity="0.1" />
      </g>
      <defs>
        <clipPath id="clip0_testimonial">
          <rect width="81.2621" height="67.125" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export function Testimonial() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="w-[calc(100%-32px)] sm:w-[calc(100%-48px)] max-w-[1440px] mx-auto">
  <div className="flex flex-col lg:flex-row gap-8 sm:gap-10 lg:gap-[120px] xl:gap-[200px] justify-between">
    {/* Left side - navigation text */}
    <div className="lg:w-[327px] flex-shrink-0 flex flex-col justify-between">
      <div>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
          <span
            className="text-[16px] sm:text-[18px] font-medium text-[#6a7282]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Testimonials
          </span>
        </div>

        <p
          className="text-[15px] sm:text-[18px] text-[#6a7282] leading-[24px] sm:leading-[26px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Here's what clients say about our work. True impressions, built from
          real projects, real partnerships, and results.
        </p>
      </div>

      {/* Navigation controls */}
      <div className="flex gap-3 mt-6 sm:mt-8 lg:mt-0">
        <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-[13px] bg-[#d1d5dc] flex items-center justify-center hover:bg-gray-300 transition-colors">
          <svg width="22" height="18" viewBox="0 0 18.0006 15.0008" fill="none">
            <path d={svgPaths.p33185f40} fill="#2B3038" />
          </svg>
        </button>

        <button className="w-12 h-12 sm:w-14 sm:h-14 rounded-[13px] bg-[#1e4f86] border border-[#4b729e] flex items-center justify-center rotate-180 hover:bg-[#1a4470] transition-colors">
          <svg width="22" height="18" viewBox="0 0 18.0006 15.0008" fill="none">
            <path d={svgPaths.p33185f40} fill="white" />
          </svg>
        </button>
      </div>
    </div>

    {/* Right side - quote */}
    <div className="flex-1 max-w-[831px]">
      <div className="flex flex-col gap-4 sm:gap-5">
        <QuoteIcon />

        <blockquote
          className="text-[20px] sm:text-[24px] lg:text-[28px] font-medium text-[#232323] leading-[30px] sm:leading-[34px] lg:leading-[36px]"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          From day one, they understood the vision we had — creating a space
          that felt modern, functional, and timeless. Their approach reshaped
          how our building stands in the community.
        </blockquote>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3 sm:gap-4 mt-6 sm:mt-8">
        <div className="w-[64px] h-[58px] sm:w-[80px] sm:h-[70px] rounded-[14px] sm:rounded-[16px] overflow-hidden flex-shrink-0">
          <img
            src={testimonialPerson}
            alt="Jay Prakash"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="min-w-0">
          <p
            className="text-[18px] sm:text-[20px] font-medium text-[#0d2138] leading-[28px] sm:leading-[32px]"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Jay Prakash
          </p>

          <p
            className="text-[13px] sm:text-[14px] text-[#2b3038]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Homeowner, Surrey, UK
          </p>
        </div>
      </div>
    </div>
  </div>
</div>
    </section>
  );
}
