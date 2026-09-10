"use client";

import { useTranslation } from "react-i18next";

const saleImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/services-ventas.webp";
const rentImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/services-alquileres.webp";
const valuationImg = "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/HomePageFinal/services-tasaciones.webp";

const SERVICE_IMAGES = [saleImg, rentImg, valuationImg];

export function OurServices() {
  const { t } = useTranslation("home");
  const services = (
    t("ourServices.services", { returnObjects: true }) as { title: string; desc: string }[]
  ).map((s, i) => ({ ...s, img: SERVICE_IMAGES[i] }));

  return (
    <section className="bg-[#f8fafc] py-16 lg:py-20">
     <div className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[var(--space-fluid-container-max)] mx-auto">
  {/* Header */}
  <div className="flex flex-col items-center gap-3 sm:gap-4 mb-8 sm:mb-10 lg:mb-12">
    <div className="flex items-center gap-2">
      <div className="w-[7px] h-[7px] rounded-full bg-[#4896b6]" />
      <span
        className="text-[14px] sm:text-[16px] font-medium text-[#6a7282]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("ourServices.badge")}
      </span>
    </div>

    <div className="text-center max-w-[480px]">
      <h2
        className="text-[28px] sm:text-[34px] lg:text-[44px] font-semibold text-[#232323] leading-[36px] sm:leading-[42px] lg:leading-tight"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        {t("ourServices.title")}
      </h2>

      <p
        className="mt-2 sm:mt-3 text-[14px] sm:text-[15px] lg:text-[16px] text-[#2b3038] leading-[22px] sm:leading-[24px]"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("ourServices.subtitle")}
      </p>
    </div>
  </div>

  {/* Cards */}
  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 sm:gap-6">
    {services.map((s) => (
      <div
        key={s.title}
        className="relative h-[320px] sm:h-[360px] lg:h-[440px] rounded-[20px] sm:rounded-[24px] overflow-hidden"
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
              "linear-gradient(179.964deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 72%, rgba(0,0,0,0.65) 100%)",
          }}
        />

        {/* Text */}
        <div className="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7 lg:bottom-8 lg:left-8 lg:right-8 max-w-[336px]">
          <h3
            className="text-[22px] sm:text-[25px] lg:text-[28px] font-semibold text-white leading-[30px] sm:leading-[34px] lg:leading-[36px] mb-2"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {s.title}
          </h3>

          <p
            className="text-[14px] sm:text-[15px] lg:text-[16px] font-medium text-[rgba(255,255,255,0.85)] leading-[22px] sm:leading-[24px]"
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
