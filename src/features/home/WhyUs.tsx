import svgPaths from "@/assets/svg-6s7nojygyu";

const personImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/whyexpert.png";

const stats = [
  {
    value: "84%",
    label: "Close faster",
    desc: "When clients collaborate with expert agents, they finish their transactions more quickly.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 34.1918 34.1731" fill="none">
        <path d={svgPaths.p2cb34680} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    value: "$5M+",
    label: "Saved yearly",
    desc: "We help buyers avoid overpaying while securing value in Florida markets.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 25 39.6667" fill="none">
        <path d={svgPaths.p3ec057c0} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    value: "3 in 5",
    label: "Win offers",
    desc: "More than half of our clients secure their ideal home on the first or second offer.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 39.6667 39.6667" fill="none">
        <path d={svgPaths.p1a11c480} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    ),
  },
  {
    value: "95%",
    label: "Refer friends",
    desc: "Most clients recommend our team after experiencing smooth closings.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 39.4325 36.0007" fill="none">
        <path d={svgPaths.p1fbdbc80} stroke="#2B3038" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
      </svg>
    ),
  },
];

export function WhyUs() {
  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        {/* Section Header */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Why Us
            </span>
          </div>
          <div className="text-center">
            <h2
              className="text-[32px] lg:text-[44px] font-semibold text-[#232323] leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Ulrich's home experts
            </h2>
            <p
              className="mt-3 text-[16px] text-[#2b3038] max-w-[460px] mx-auto"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              We have over +10 years of experience in the real estate market
            </p>
          </div>
        </div>

        {/* Content row */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left - Dark card with person */}
          <div className="relative bg-[#111112] rounded-[20px] overflow-hidden lg:w-[420px] flex-shrink-0 min-h-[500px] lg:min-h-[688px]">
            <img
              src={personImg}
              alt="Agent"
              className="w-full h-full object-cover object-top absolute inset-0"
            />
            {/* Gradient */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(179.963deg, rgba(146,146,146,0) 49.928%, rgba(68,68,68,0.42) 73.946%, rgba(0,0,0,0.6) 95.036%)",
              }}
            />
            {/* Top badge */}
            <div className="absolute top-6 left-6 flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-[7px] h-[7px] rounded-full border border-[#0088ff] bg-white" />
                <span
                  className="text-white text-[16px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  Ulrich's best agency
                </span>
              </div>
              <p
                className="text-white text-[28px] font-medium leading-[36px]"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                2K+ clients choose Ulrich
              </p>
            </div>
            {/* Bottom text */}
            <div className="absolute bottom-6 left-6 right-6">
              <p
                className="text-white text-[16px] leading-[24px] opacity-90"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              >
                Choosing us matters — experience and clear guidance shape every
                real-estate decision. We help clients move forward with
                confidence.
              </p>
            </div>
          </div>

          {/* Right - Stats grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            {stats.map((stat) => (
              <div
                key={stat.value}
                className="bg-[#f8fafc] rounded-[20px] p-6 flex flex-col justify-between min-h-[200px] lg:min-h-[310px]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p
                      className="text-[26px] lg:text-[28px] font-medium text-[#0d2138] leading-[36px]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="text-[26px] lg:text-[28px] font-medium text-[#0d2138] leading-[36px]"
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {stat.label}
                    </p>
                  </div>
                  <div className="flex-shrink-0">{stat.icon}</div>
                </div>
                <p
                  className="text-[16px] text-[#2b3038] leading-[24px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
