"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signUpWithPassword } from "./actions";
import { signInWithOAuth } from "./oauth";
import { AuthBanner } from "./components/AuthBanner";
import { AuthLogo } from "./components/AuthLogo";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

function IconEnvelope() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M14.167 17.083H5.833c-2.5 0-4.166-1.25-4.166-4.166V7.083c0-2.916 1.666-4.166 4.166-4.166h8.334c2.5 0 4.166 1.25 4.166 4.166v5.834c0 2.916-1.666 4.166-4.166 4.166z"
        stroke="#868c98"
        strokeWidth="1.25"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14.167 7.5l-3.116 2.5c-1.025.817-2.717.817-3.742 0L4.167 7.5"
        stroke="#868c98"
        strokeWidth="1.25"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5 8.333V6.25a5 5 0 0110 0v2.083"
        stroke="#868c98"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="2.5"
        y="8.333"
        width="15"
        height="9.584"
        rx="2.5"
        stroke="#868c98"
        strokeWidth="1.25"
      />
      <circle cx="10" cy="13.125" r="1.25" fill="#868c98" />
      <path
        d="M10 14.375v1.25"
        stroke="#868c98"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconEye({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12.984 10a2.984 2.984 0 11-5.968 0 2.984 2.984 0 015.968 0z"
          stroke="#6a7282"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10 16.892c-3.534 0-6.825-2.083-9.117-5.7a3.434 3.434 0 010-3.392C3.175 4.208 6.466 2.125 10 2.125s6.825 2.083 9.117 5.675a3.434 3.434 0 010 3.392c-2.292 3.617-5.583 5.7-9.117 5.7z"
          stroke="#6a7282"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.108 7.892L7.892 12.108a2.983 2.983 0 014.216-4.216zM14.85 4.808C13.391 3.725 11.725 3.117 10 3.117 6.467 3.117 3.175 5.2.883 8.792a3.434 3.434 0 000 3.391 16.5 16.5 0 002.8 3.125M7.058 16.392c.942.392 1.934.6 2.942.6 3.534 0 6.825-2.083 9.117-5.7a3.434 3.434 0 000-3.392 17.5 17.5 0 00-1.125-1.658M13.108 10.558a2.984 2.984 0 01-2.55 2.55M7.892 12.108L1.667 18.333M18.333 1.667L13.108 6.892"
        stroke="#6a7282"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconArrow({ left = false }: { left?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={left ? "rotate-180" : ""}
    >
      <path
        d="M4.167 10h11.666M10.833 5l5 5-5 5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Social logos ──────────────────────────────────────────────────────────────

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M14.357 10.69c-.013-1.612.72-2.83 2.202-3.732-.83-1.186-2.079-1.843-3.727-1.978-1.55-.13-3.23.9-3.846.9-.65 0-2.16-.86-3.33-.86-2.42.04-5.006 1.94-5.006 5.83 0 1.15.21 2.34.63 3.57.56 1.6 2.58 5.53 4.69 5.47 1.09-.026 1.86-.77 3.27-.77 1.37 0 2.08.77 3.3.77 2.13-.03 3.95-3.6 4.48-5.2-2.84-1.34-2.665-3.93-2.665-3.997zM11.68 3.36c1.22-1.46.99-2.79.91-3.36-1.01.06-2.18.69-2.85 1.46-.73.83-1.15 1.85-1.07 2.97 1.1.084 2.1-.49 3.01-1.07z"
        fill="#1a1a1a"
      />
    </svg>
  );
}

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="8.5" height="8.5" fill="#F25325" />
      <rect x="10.5" y="1" width="8.5" height="8.5" fill="#80BC06" />
      <rect x="1" y="10.5" width="8.5" height="8.5" fill="#05A6F0" />
      <rect x="10.5" y="10.5" width="8.5" height="8.5" fill="#FEBA08" />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878V12.89h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
        fill="#1877F2"
      />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4c-.22 1.22-.93 2.26-1.99 2.95v2.44h3.22c1.89-1.74 2.97-4.3 2.97-7.18z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.97-.89 6.63-2.41l-3.22-2.5c-.9.6-2.04.96-3.41.96-2.62 0-4.84-1.77-5.63-4.15H1.06v2.58A10 10 0 0010 20z"
        fill="#34A853"
      />
      <path
        d="M4.37 11.9A5.95 5.95 0 014.07 10c0-.66.11-1.3.3-1.9V5.52H1.06A10 10 0 000 10c0 1.61.38 3.14 1.06 4.48L4.37 11.9z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.8.51 3.84 1.5l2.87-2.87C14.96 1 12.69 0 10 0 6.09 0 2.75 2.24 1.06 5.52L4.37 8.1C5.16 5.73 7.38 3.96 10 3.96z"
        fill="#EA4335"
      />
    </svg>
  );
}


// ── Main component ────────────────────────────────────────────────────────────

export function SignUpPageContent() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    title: string;
    message: string;
  } | null>(null);

  const flashBanner = (title: string, message: string) => {
    setBanner({ title, message });
    setTimeout(() => setBanner(null), 4000);
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    if (isOAuthSubmitting || isSubmitting) return;
    setIsOAuthSubmitting(true);
    const result = await signInWithOAuth(provider);
    if (result.error) {
      setIsOAuthSubmitting(false);
      flashBanner("Sign-in failed", result.error);
    }
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    if (!fullName || !email || !password) {
      setBanner({
        title: "Missing information",
        message: "Please fill in your name, email, and password.",
      });
      setTimeout(() => setBanner(null), 4000);
      return;
    }

    setIsSubmitting(true);
    const result = await signUpWithPassword({ fullName, email, password });
    setIsSubmitting(false);

    if (result.error) {
      setBanner({
        title: "Couldn't create your account",
        message: result.error,
      });
      setTimeout(() => setBanner(null), 5000);
      return;
    }

    router.push(
      `/verify-otp?email=${encodeURIComponent(email)}&type=signup&context=register`,
    );
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      {banner && (
        <AuthBanner
          type="error"
          title={banner.title}
          message={banner.message}
        />
      )}

      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        {/* Logo */}
        <AuthLogo className="shrink-0 px-10 lg:px-15" />

        {/* Form — centred vertically and horizontally in remaining space */}
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px]">
            {/* Heading */}
            <div className="mb-[30px]">
              <h1
                className="
    mb-[2px]
    text-[32px] leading-[44px]
    tracking-[-0.32px] text-[#0d2138]
    max-md:text-[30px]
    max-md:leading-[40px]
    max-sm:text-[26px]
    max-sm:leading-[34px]
    max-sm:tracking-[-0.26px]
  "
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 600,
                }}
              >
                Sign Up
              </h1>
              <p
                className="text-[18px] leading-[26px] tracking-[-0.18px] text-[#6a7282]"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 400 }}
              >
                Sign up to continue to your dashboard
              </p>
            </div>

            {/* Fields */}
            <div className="flex flex-col gap-[24px]">
              <div className="flex flex-col gap-[24px]">
                {/* Full Name */}
                <div className="flex flex-col gap-[4px]">
                  <label
                    className="flex items-center gap-[1px] text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#2b3038]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Full Name
                    <span
                      className="text-[#8b5cf6]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      *
                    </span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full bg-white border border-[#d1d5dc] rounded-[12px] px-[12px] py-[16px] text-[16px] leading-[24px] tracking-[-0.16px] text-[#868c98] placeholder:text-[#868c98] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] outline-none focus:border-[#1e4f86] focus:ring-0 transition-colors"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      fontWeight: 400,
                    }}
                  />
                </div>

                {/* Email Address */}
                <div className="flex flex-col gap-[4px]">
                  <label
                    className="flex items-center gap-[1px] text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#2b3038]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Email Address
                    <span
                      className="text-[#8b5cf6]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center gap-[8px] bg-white border border-[#d1d5dc] rounded-[12px] pl-[12px] pr-[10px] py-[16px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors">
                    <IconEnvelope />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="flex-1 min-w-0 text-[16px] leading-[24px] tracking-[-0.16px] text-[#868c98] placeholder:text-[#868c98] bg-transparent outline-none"
                      style={{
                        fontFamily: "'Montserrat', sans-serif",
                        fontWeight: 400,
                      }}
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="flex flex-col gap-[4px]">
                  <label
                    className="flex items-center gap-[1px] text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#2b3038]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Password
                    <span
                      className="text-[#8b5cf6]"
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      *
                    </span>
                  </label>
                  <div className="flex items-center gap-[8px] bg-white border border-[#d1d5dc] rounded-[12px] pl-[12px] pr-[10px] py-[16px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors">
                    <IconLock />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="• • • • • • • • • •"
                      className="flex-1 min-w-0 text-[14px] leading-[20px] tracking-[-0.084px] text-[#868c98] placeholder:text-[#868c98] bg-transparent outline-none"
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 400,
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="shrink-0 flex items-center justify-center"
                    >
                      <IconEye visible={showPassword} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Button + checkbox row */}
              <div className="flex flex-col gap-[13px]">
                <button
                  type="button"
                  onClick={handleSignUp}
                  disabled={isSubmitting}
                  className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-[8px] py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors disabled:opacity-60"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  {isSubmitting ? "Creating your account…" : "Sign Up"}
                </button>
              </div>

              {/* OR divider + social buttons */}
              <div className="flex flex-col gap-[24px]">
                {/* Divider */}
                <div className="flex items-center gap-[10px]">
                  <div className="flex-1 h-px bg-[#e6e6e6]" />
                  <span
                    className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#808284]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    OR
                  </span>
                  <div className="flex-1 h-px bg-[#e6e6e6]" />
                </div>

                {/* Social buttons */}
                <div className="flex gap-[12px] h-[54px]">
                  <button
                    type="button"
                    disabled
                    className="flex-1 bg-white border border-[#d1d5dc] rounded-[10px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] flex items-center justify-center opacity-40 cursor-not-allowed"
                  >
                    <AppleLogo />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("google")}
                    disabled={isOAuthSubmitting || isSubmitting}
                    className="flex-1 bg-white border border-[#d1d5dc] rounded-[10px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <GoogleLogo />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOAuth("facebook")}
                    disabled={isOAuthSubmitting || isSubmitting}
                    className="flex-1 bg-white border border-[#d1d5dc] rounded-[10px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-60"
                  >
                    <FacebookLogo />
                  </button>
                  <button
                    type="button"
                    disabled
                    className="flex-1 bg-white border border-[#d1d5dc] rounded-[10px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] flex items-center justify-center opacity-40 cursor-not-allowed"
                  >
                    <MicrosoftLogo />
                  </button>
                </div>
              </div>

              {/* Already have account */}
              <p
                className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#00010f] text-center"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 500,
                }}
              >
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-[#1e4f86] underline decoration-solid underline-offset-auto hover:text-[#1b487a]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 flex items-center gap-[14px] px-10 lg:px-[60px] max-sm:w-full max-sm:flex-col max-sm:gap-2 max-sm:px-4 max-sm:py-3">
  <span
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap max-sm:text-[12px] max-sm:leading-[18px] max-sm:text-center"
    style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
  >
    © 2026 Ulrich Propiedades
  </span>

  <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:hidden" />

  <div className="flex items-center gap-[14px] max-sm:gap-2">
    <Link
      href="/privacy-policy"
      className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
      style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
    >
      Privacy
    </Link>

    <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:h-[12px]" />

    <Link
      href="/terms-conditions"
      className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
      style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
    >
      Terms
    </Link>
  </div>
</div>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex shrink-0 w-[735px] m-[16px] rounded-[12px] overflow-hidden relative bg-[#f4f4f4] border border-[#e6e6e6] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.05)]"
        style={{ minHeight: "calc(100vh - 32px)" }}
      >
        {/* Photo */}
        <Image
          src="/assets/figma-temp/SignUp/hero-bg.png"
          alt="White Mediterranean architecture"
          fill
          sizes="735px"
          className="object-cover"
          priority
        />

        {/* Bottom overlay text */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent pt-[80px] pb-[60px] px-[39px]">
          <div className="flex flex-col gap-[20px] max-w-[495px]">
            <div className="flex flex-col gap-[12px]">
              <h2
                className="text-[32px] leading-[44px] tracking-[-0.32px] text-white"
                style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600 }}
              >
                Your Data, Your Control
              </h2>
              <p
                className="text-[16px] leading-[24px] tracking-[-0.16px] text-white"
                style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 400,
                }}
              >
                We store only what&apos;s needed to run your account. No
                tracking pixels. No behavioral analytics. No selling your data.
              </p>
            </div>
           <Link
              href="/privacy-policy"
              className="text-[16px] leading-[24px] tracking-[-0.16px] font-medium text-white no-underline"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Read our privacy policy →
            </Link>
          </div>

          {/* Arrow nav */}
          <div className="absolute bottom-[28px] right-[28px] flex items-center gap-[20px]">
            <button
              type="button"
              className="flex items-center justify-center w-[24px] h-[24px] opacity-80 hover:opacity-100 transition-opacity"
            >
              <IconArrow left />
            </button>
            <button
              type="button"
              className="flex items-center justify-center w-[24px] h-[24px] opacity-80 hover:opacity-100 transition-opacity"
            >
              <IconArrow />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
