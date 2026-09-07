"use client";

import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion, useScroll, useTransform } from "framer-motion";

const heroImg = "/hero/hero-home.webp";

export function HeroSection() {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  const { t } = useTranslation("home");

  return (
    <section
      ref={heroRef}
      className="w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto pt-4 sm:pt-5"
    >
      <div className="relative h-[560px] sm:h-[680px] lg:h-[820px] xl:h-[873px] w-full overflow-hidden rounded-[20px]">
        <motion.img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ y: imgY, scale: 1.12 }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(180deg, rgba(5,22,44,0.15) 0%, rgba(5,22,44,0.1) 45%, rgba(20,20,20,0.2) 75%, rgba(10,10,10,0.4) 100%)",
          }}
        />

        <motion.div
          className="relative z-10 flex h-full max-w-[720px] flex-col justify-center gap-4 px-6 pt-[70px] sm:gap-5 sm:px-10 sm:pt-[80px] lg:px-12"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">
            <span className="size-1.5 shrink-0 rounded-full bg-white" />
            <span
              className="text-[11px] uppercase tracking-[1.2px] text-white sm:text-[12px]"
              style={{ fontFamily: "Poppins, sans-serif", fontWeight: 500 }}
            >
              {t("hero.badge")}
            </span>
          </div>

          <h1
            className="text-[32px] leading-[39px] text-white sm:text-[44px] sm:leading-[52px] lg:text-[52px] lg:leading-[62px] xl:text-[60px] xl:leading-[70px]"
            style={{ fontFamily: "Neue Haas Grotesk Display Pro, Poppins, sans-serif", fontWeight: 400 }}
          >
            {t("hero.titlePrefix")}
            <span style={{ fontFamily: "'IvyPresto Display', Georgia, serif", fontStyle: "italic" }}>
              {t("hero.titleAccent")}
            </span>
          </h1>

          <p
            className="max-w-[560px] text-[15px] leading-[1.45] text-white/90 sm:text-[18px] lg:text-[20px]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            {t("hero.subtitle")}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
