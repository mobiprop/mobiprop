"use client";

import { useState } from "react";
import svgPaths from "@/assets/svg-6s7nojygyu";

const bgImg =
  "https://zkqcerjbcvpceiyvpqjz.supabase.co/storage/v1/object/public/Ulrich%20Assets/AboutUs/contactformbg.webp";

function ArrowRight() {
  return (
    <svg width="18" height="15" viewBox="0 0 16.4 13.6669" fill="none">
      <path d={svgPaths.p3ae39900} fill="white" />
    </svg>
  );
}

export function ConsultationBanner() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    topic: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  return (
    <section className="relative w-full py-12 sm:py-16 lg:py-20 overflow-hidden">
  {/* Background */}
  <div className="absolute inset-0">
    <img src={bgImg} alt="" className="w-full h-full object-cover" />
    <div className="absolute inset-0 bg-[rgba(10,25,53,0.35)]" />
  </div>

  {/* Card */}
  <div className="relative z-10 w-[calc(100%-32px)] sm:w-[calc(100%-35px)] max-w-[1440px] mx-auto flex justify-center">
    <div className="bg-white rounded-[18px] sm:rounded-[20px] p-5 sm:p-8 lg:p-10 w-full max-w-[540px] shadow-xl">
      <h2
        className="text-[26px] sm:text-[30px] lg:text-[36px] font-medium text-[#0d2138] leading-[34px] sm:leading-[38px] lg:leading-[1.3] mb-5 sm:mb-7"
        style={{ fontFamily: "Poppins, sans-serif" }}
      >
        Schedule a free consultation
      </h2>

      <div className="flex flex-col gap-3 sm:gap-4">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Full Name
          </label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="eg. Albert Jones"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          />
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Email address
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="albert@email.com"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          />
        </div>

        {/* Topic */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Topic
          </label>
          <input
            name="topic"
            value={form.topic}
            onChange={handleChange}
            placeholder="Consultation"
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#6a7282] outline-none focus:border-[#1e4f86] transition-colors"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[14px] font-medium text-[#0d2138]"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Messages
          </label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            placeholder="Enter a message"
            rows={4}
            className="w-full border border-[#d1d5dc] rounded-[10px] px-3 py-3 text-[14px] text-[#99a1af] outline-none focus:border-[#1e4f86] transition-colors resize-none"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          />
        </div>
      </div>

      {/* Submit */}
      <button
        className="relative mt-5 sm:mt-6 w-full overflow-hidden flex items-center justify-center gap-3 py-[14px] rounded-[48px] text-white text-[14px] sm:text-[16px] font-medium transition-opacity hover:opacity-90 tracking-[-0.01em]"
        style={{
          fontFamily: "Montserrat, sans-serif",
          background: "linear-gradient(to bottom, #005ea4, #006fc2)",
          border: "1px solid #0088ff",
        }}
      >
        <span
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage: "url('/assets/figma-temp/BlogPage/btn-img.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <span className="relative z-10 flex items-center justify-center gap-3">
          Book a Free consultation
          <ArrowRight />
        </span>
      </button>
    </div>
  </div>
</section>
  );
}
