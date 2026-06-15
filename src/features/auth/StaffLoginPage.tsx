"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthBanner } from "./components/AuthBanner";
import { AuthLogo } from "./components/AuthLogo";
import { signInStaff } from "./staff-actions";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconEnvelope({ error = false }: { error?: boolean }) {
  const stroke = error ? "#df1c41" : "#868c98";
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14.167 17.083H5.833c-2.5 0-4.166-1.25-4.166-4.166V7.083c0-2.916 1.666-4.166 4.166-4.166h8.334c2.5 0 4.166 1.25 4.166 4.166v5.834c0 2.916-1.666 4.166-4.166 4.166z" stroke={stroke} strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.167 7.5l-3.116 2.5c-1.025.817-2.717.817-3.742 0L4.167 7.5" stroke={stroke} strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8.333V6.25a5 5 0 0110 0v2.083" stroke="#868c98" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2.5" y="8.333" width="15" height="9.584" rx="2.5" stroke="#868c98" strokeWidth="1.25"/>
      <circle cx="10" cy="13.125" r="1.25" fill="#868c98"/>
    </svg>
  );
}

function IconEye({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.984 10a2.984 2.984 0 11-5.968 0 2.984 2.984 0 015.968 0z" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 16.892c-3.534 0-6.825-2.083-9.117-5.7a3.434 3.434 0 010-3.392C3.175 4.208 6.466 2.125 10 2.125s6.825 2.083 9.117 5.675a3.434 3.434 0 010 3.392c-2.292 3.617-5.583 5.7-9.117 5.7z" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.108 7.892L7.892 12.108a2.983 2.983 0 014.216-4.216zM14.85 4.808C13.391 3.725 11.725 3.117 10 3.117 6.467 3.117 3.175 5.2.883 8.792a3.434 3.434 0 000 3.391 16.5 16.5 0 002.8 3.125M7.058 16.392c.942.392 1.934.6 2.942.6 3.534 0 6.825-2.083 9.117-5.7a3.434 3.434 0 000-3.392 17.5 17.5 0 00-1.125-1.658M13.108 10.558a2.984 2.984 0 01-2.55 2.55M7.892 12.108L1.667 18.333M18.333 1.667L13.108 6.892" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="7" stroke="#df1c41" strokeWidth="1.25"/>
      <path d="M8 4.667V8.5" stroke="#df1c41" strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.7" fill="#df1c41"/>
    </svg>
  );
}

function AppleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14.357 10.69c-.013-1.612.72-2.83 2.202-3.732-.83-1.186-2.079-1.843-3.727-1.978-1.55-.13-3.23.9-3.846.9-.65 0-2.16-.86-3.33-.86-2.42.04-5.006 1.94-5.006 5.83 0 1.15.21 2.34.63 3.57.56 1.6 2.58 5.53 4.69 5.47 1.09-.026 1.86-.77 3.27-.77 1.37 0 2.08.77 3.3.77 2.13-.03 3.95-3.6 4.48-5.2-2.84-1.34-2.665-3.93-2.665-3.997zM11.68 3.36c1.22-1.46.99-2.79.91-3.36-1.01.06-2.18.69-2.85 1.46-.73.83-1.15 1.85-1.07 2.97 1.1.084 2.1-.49 3.01-1.07z" fill="#1a1a1a"/>
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4c-.22 1.22-.93 2.26-1.99 2.95v2.44h3.22c1.89-1.74 2.97-4.3 2.97-7.18z" fill="#4285F4"/>
      <path d="M10 20c2.7 0 4.97-.89 6.63-2.41l-3.22-2.5c-.9.6-2.04.96-3.41.96-2.62 0-4.84-1.77-5.63-4.15H1.06v2.58A10 10 0 0010 20z" fill="#34A853"/>
      <path d="M4.37 11.9A5.95 5.95 0 014.07 10c0-.66.11-1.3.3-1.9V5.52H1.06A10 10 0 000 10c0 1.61.38 3.14 1.06 4.48L4.37 11.9z" fill="#FBBC05"/>
      <path d="M10 3.96c1.47 0 2.8.51 3.84 1.5l2.87-2.87C14.96 1 12.69 0 10 0 6.09 0 2.75 2.24 1.06 5.52L4.37 8.1C5.16 5.73 7.38 3.96 10 3.96z" fill="#EA4335"/>
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M20 10a10 10 0 10-11.563 9.879v-6.99H5.898V10h2.539V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.889h-2.33v6.99A10.002 10.002 0 0020 10z" fill="#1877F2"/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function StaffLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const inactiveFlag = searchParams.get("error") === "inactive";

  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(
    inactiveFlag
      ? { type: "error", title: "Account inactive", message: "Your account is inactive. Please contact an administrator." }
      : null,
  );

  const flashBanner = (next: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(next);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleLogin = async () => {
    if (isSubmitting) return;

    if (!email || !password) {
      setEmailError(!email);
      flashBanner({ type: "error", title: "Missing details", message: "Enter your email and password to continue." });
      return;
    }

    setIsSubmitting(true);
    const result = await signInStaff({ email, password });

    if (!result.ok) {
      setIsSubmitting(false);
      setEmailError(result.reason === "credentials" || result.reason === "not_staff");
      flashBanner({ type: "error", title: "Couldn't sign you in", message: result.error });
      return;
    }

    router.push(redirectTo);
  };

  const mont = { fontFamily: "'Montserrat', sans-serif" };
  const poppins = { fontFamily: "'Poppins', sans-serif" };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      {banner && <AuthBanner type={banner.type} title={banner.title} message={banner.message} />}

      {/* ── Left panel ── */}
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px]">
            {/* Heading */}
            <div className="mb-[30px]">
              <h1 className="text-[32px] leading-[44px] tracking-[-0.32px] text-[#0d0d12] mb-[2px]" style={{ ...poppins, fontWeight: 600 }}>
                Welcome Back
              </h1>
              <p className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#666d80]" style={{ ...poppins, fontWeight: 400 }}>
                Glad to see you again. Log in to your account.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-6">
                {/* Email */}
                <div className="flex flex-col gap-[4px]">
                  <label className="flex items-center gap-px text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>
                    Email Address<span className="text-[#df1c41]" style={{ fontFamily: "'Inter', sans-serif" }}>*</span>
                  </label>
                  <div className={`flex items-center gap-2 border rounded-[12px] pl-[12px] pr-[10px] py-4 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] transition-colors ${emailError ? "bg-[#fff0f3] border-[#df1c41]" : "bg-white border-[#dfe1e7] focus-within:border-[#1e4f86]"}`}>
                    <IconEnvelope error={emailError} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setEmailError(false); }}
                      placeholder="Enter your email address"
                      className={`flex-1 min-w-0 text-[16px] leading-[24px] tracking-[-0.16px] bg-transparent outline-none ${emailError ? "text-[#0d0d12]" : "text-[#818898] placeholder:text-[#818898]"}`}
                      style={{ ...mont, fontWeight: 400 }}
                    />
                  </div>
                  {emailError && (
                    <div className="flex items-center gap-2 mt-px">
                      <IconAlert />
                      <span className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#df1c41]" style={{ ...mont, fontWeight: 400 }}>
                        The email address you entered is incorrect.
                      </span>
                    </div>
                  )}
                </div>

                {/* Password */}
                <div className="flex flex-col gap-[4px]">
                  <label className="flex items-center gap-px text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>
                    Password<span className="text-[#df1c41]" style={{ fontFamily: "'Inter', sans-serif" }}>*</span>
                  </label>
                  <div className="flex items-center gap-2 bg-white border border-[#dfe1e7] rounded-[12px] pl-[12px] pr-[10px] py-4 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors">
                    <IconLock />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="flex-1 min-w-0 text-[14px] leading-[20px] tracking-[-0.084px] text-[#818898] placeholder:text-[#818898] bg-transparent outline-none"
                      style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0">
                      <IconEye visible={showPassword} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Options row */}
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <div className="relative size-5 shrink-0" onClick={() => setKeepLoggedIn(!keepLoggedIn)}>
                    <div className="absolute inset-[10%] rounded-[4px] bg-[#e6e6e6]" />
                    <div className="absolute inset-[17.5%] rounded-[2.6px] bg-white shadow-[0px_2px_2px_0px_rgba(27,28,29,0.12)] flex items-center justify-center">
                      {keepLoggedIn && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4L3.667 7 9 1" stroke="#1e4f86" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </div>
                  <span className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#666d80] whitespace-nowrap" style={mont}>Keep me login</span>
                </label>
                <Link href="/reset-password" className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#1e4f86] whitespace-nowrap hover:underline" style={mont}>
                  Forgot Password?
                </Link>
              </div>

              {/* Button */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={isSubmitting}
                className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-2 py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors disabled:bg-[#b9c8d9] disabled:border-[#b9c8d9]"
                style={mont}
              >
                {isSubmitting ? "Please wait…" : "Login"}
              </button>

              {/* OR + socials */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center gap-[10px]">
                  <div className="flex-1 h-px bg-[#e6e6e6]" />
                  <span className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#808284]" style={mont}>OR</span>
                  <div className="flex-1 h-px bg-[#e6e6e6]" />
                </div>
                <div className="flex gap-3 h-[54px]">
                  {[<AppleLogo key="apple" />, <GoogleLogo key="google" />, <FacebookLogo key="fb" />].map((logo, i) => (
                    <button key={i} type="button" disabled title="Coming soon" className="flex-1 bg-white border border-[#d1d5dc] rounded-[10px] shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] flex items-center justify-center opacity-60 cursor-not-allowed">
                      {logo}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom note — staff cannot self-register */}
              <p className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] text-center" style={{ ...mont, fontWeight: 400 }}>
                Need access? Ask an administrator to send you an invitation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
       <div className="shrink-0 flex items-center gap-[14px] px-10 max-sm:flex-wrap max-sm:justify-center max-sm:gap-x-2 max-sm:gap-y-1.5 max-sm:px-4 max-sm:py-3 max-sm:text-center">
  <span
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap max-sm:w-full max-sm:text-[12px] max-sm:leading-[18px] max-sm:tracking-[-0.12px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    © 2026 Ulrich Propiedades
  </span>

  <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:hidden" />

  <Link
    href="/privacy-policy"
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    Privacy
  </Link>

  <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:h-[12px]" />

  <Link
    href="/terms-conditions"
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    Terms
  </Link>
</div>
      </div>

      {/* ── Right panel ── */}
      <AuthRightPanel variant="staff" />
    </div>
  );
}
