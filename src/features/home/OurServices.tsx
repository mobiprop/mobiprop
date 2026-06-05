const saleImg = "/assets/figma-temp/HomePageFinal/62b50ef3e3f67ed4177e1250466caedbe6eadd73.png";
const rentImg = "/assets/figma-temp/HomePageFinal/cbf69b2d981b9c83b2b765f466f970433e393ed1.png";
const valuationImg = "/assets/figma-temp/HomePageFinal/fd8922f41e7e274cd12ce592b50c346d6017220c.png";

const services = [
  {
    img: saleImg,
    title: "Sale",
    desc: "We make finding your perfect property effortless and fast.",
  },
  {
    img: rentImg,
    title: "Rentals",
    desc: "We make finding your perfect rental effortless in Florida neighborhoods.",
  },
  {
    img: valuationImg,
    title: "Valuation",
    desc: "We make understanding your home's value and best deals effortless.",
  },
];

export function OurServices() {
  return (
    <section className="bg-[#f8fafc] py-16 lg:py-20">
      <div className="max-w-[1440px] mx-auto px-6 lg:px-16">
        {/* Header */}
        <div className="flex flex-col items-center gap-4 mb-12">
          <div className="flex items-center gap-2">
            <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
            <span
              className="text-[16px] font-medium text-[#6a7282]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Our services
            </span>
          </div>
          <div className="text-center max-w-[480px]">
            <h2
              className="text-[32px] lg:text-[44px] font-semibold text-[#232323] leading-tight"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              What we offer
            </h2>
            <p
              className="mt-3 text-[15px] lg:text-[16px] text-[#2b3038]"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              We help simplify selling and purchase decisions with a reliable
              service, speed &amp; transparency
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((s) => (
            <div
              key={s.title}
              className="relative h-[360px] lg:h-[440px] rounded-[24px] overflow-hidden"
            >
              <img
                src={s.img}
                alt={s.title}
                className="w-full h-full object-cover"
              />
              {/* Dark gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(179.964deg, rgba(0,0,0,0) 58.44%, rgba(0,0,0,0.45) 73.252%, rgba(0,0,0,0.6) 99.967%)",
                }}
              />
              {/* Text */}
              <div className="absolute bottom-8 left-8 right-8">
                <h3
                  className="text-[26px] lg:text-[28px] font-semibold text-white leading-[36px] mb-2"
                  style={{ fontFamily: "Poppins, sans-serif" }}
                >
                  {s.title}
                </h3>
                <p
                  className="text-[15px] font-medium text-[rgba(255,255,255,0.85)] leading-[24px]"
                  style={{ fontFamily: "Montserrat, sans-serif" }}
                >
                  {s.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
