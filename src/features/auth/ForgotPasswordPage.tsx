"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthBanner } from "./components/AuthBanner";
import { AuthLogo } from "./components/AuthLogo";
import { requestPasswordReset } from "./actions";

function IconEnvelope() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14.167 17.083H5.833c-2.5 0-4.166-1.25-4.166-4.166V7.083c0-2.916 1.666-4.166 4.166-4.166h8.334c2.5 0 4.166 1.25 4.166 4.166v5.834c0 2.916-1.666 4.166-4.166 4.166z" stroke="#868c98" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.167 7.5l-3.116 2.5c-1.025.817-2.717.817-3.742 0L4.167 7.5" stroke="#868c98" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#99a1af" strokeWidth="1.25"/>
      <path d="M8 7.333V11" stroke="#99a1af" strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="8" cy="5.333" r="0.667" fill="#99a1af"/>
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5l-5 5 5 5" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function ForgotPasswordPageContent() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);

  const mont = { fontFamily: "'Montserrat', sans-serif" };
  const poppins = { fontFamily: "'Poppins', sans-serif" };

  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await requestPasswordReset({ email });
    setIsSubmitting(false);

    if (result.error) {
      flashBanner({ type: "error", title: "Couldn't send reset link", message: result.error });
      return;
    }

    flashBanner({ type: "success", title: "Check your email", message: `We've sent a password reset link to ${email}.` });
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      {banner && <AuthBanner type={banner.type} title={banner.title} message={banner.message} />}
      {/* ── Left panel ── */}
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px]">
            {/* Back link */}
            <Link href="/login" className="flex items-center gap-[6px] mb-4 w-fit hover:opacity-70 transition-opacity">
              <IconArrowLeft />
              <span className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>Back</span>
            </Link>

            {/* Heading */}
            <div className="mb-[52px]">
              <h1 className=" mb-[2px]
  text-[32px] leading-[44px]
  tracking-[-0.32px] text-[#0d2138]

  max-md:text-[30px]
  max-md:leading-[40px]
  max-md:tracking-[-0.3px]

  max-sm:text-[26px]
  max-sm:leading-[34px]
  max-sm:tracking-[-0.26px]" style={{ ...poppins, fontWeight: 600 }}>
                Reset Password
              </h1>
              <p className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#6a7282]" style={{ ...mont, fontWeight: 400 }}>
                Enter your email to reset your password.
              </p>
            </div>

            <div className="flex flex-col gap-8">
              {/* Email field + hint */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-[4px]">
                  <label className="flex items-center gap-px text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#2b3038]" style={mont}>
                    Email Address<span className="text-[#8b5cf6]" style={{ fontFamily: "'Inter', sans-serif" }}>*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-[#d1d5dc] rounded-[12px] pl-[12px] pr-[10px] py-4 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors">
                    <IconEnvelope />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 min-w-0 text-[16px] leading-[24px] tracking-[-0.16px] text-[#868c98] placeholder:text-[#868c98] bg-transparent outline-none"
                      style={{ ...mont, fontWeight: 400 }}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <IconInfo />
                  <span className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#99a1af]" style={{ ...mont, fontWeight: 400 }}>
                    Enter the email with which you&apos;ve registered
                  </span>
                </div>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-2 py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors disabled:opacity-60"
                style={mont}
              >
                {isSubmitting ? "Sending…" : "Forget Password"}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-[14px] px-10">
          <span className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap" style={{ ...mont, fontWeight: 400 }}>© 2026 Ulrich Propiedades</span>
          <div className="w-px h-[14px] bg-[#d1d5dc]" />
          <Link href="/privacy" className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138]" style={{ ...mont, fontWeight: 400 }}>Privacy</Link>
          <div className="w-px h-[14px] bg-[#d1d5dc]" />
          <Link href="/terms" className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138]" style={{ ...mont, fontWeight: 400 }}>Terms</Link>
        </div>
      </div>

      <AuthRightPanel />
    </div>
  );
}
