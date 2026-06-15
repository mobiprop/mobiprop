"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getPostLoginRedirect, resendSignUpOtp, sendMagicLink, verifyOtp } from "./actions";
import { AuthBanner } from "./components/AuthBanner";

type OtpPageProps = {
  email?: string;
  backHref?: string;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconMailEnvelope() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M17 20.5H7C4 20.5 2 19 2 15.5V8.5C2 5 4 3.5 7 3.5H17C20 3.5 22 5 22 8.5V15.5C22 19 20 20.5 17 20.5Z" stroke="#6a7282" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M17 9L13.87 11.5C12.84 12.32 11.15 12.32 10.12 11.5L7 9" stroke="#6a7282" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
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

function IconShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1.333l5.333 2v4.334C13.333 11.2 11 13.733 8 14.667c-3-0.934-5.333-3.467-5.333-7V3.333L8 1.333z" stroke="#666d80" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9.333 1.333H4A1.333 1.333 0 002.667 2.667v10.666A1.333 1.333 0 004 14.667h8a1.333 1.333 0 001.333-1.334V5.333L9.333 1.333z" stroke="#666d80" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9.333 1.333V5.333H13.333" stroke="#666d80" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconHelp() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.667" stroke="#666d80" strokeWidth="1.25"/>
      <path d="M6.06 6a2 2 0 013.887.667c0 1.333-2 2-2 2" stroke="#666d80" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="8" cy="11" r="0.667" fill="#666d80"/>
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function OtpPageContent({ email: emailProp, backHref = "/register" }: OtpPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = emailProp ?? searchParams.get("email") ?? "";
  const otpType = (searchParams.get("type") === "email" ? "email" : "signup") as "email" | "signup";

  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const mont = { fontFamily: "'Montserrat', sans-serif" };
  const poppins = { fontFamily: "'Poppins', sans-serif" };

  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const handleInput = (index: number, value: string) => {
    const char = value.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleVerify = async () => {
    const token = otp.join("");
    if (!email) {
      flashBanner({ type: "error", title: "Missing email", message: "We couldn't find the email to verify. Please start again." });
      return;
    }
    if (token.length !== OTP_LENGTH) {
      flashBanner({ type: "error", title: "Incomplete code", message: `Enter the ${OTP_LENGTH}-digit code we sent to your email.` });
      return;
    }

    setIsVerifying(true);
    const result = await verifyOtp({ email, token, type: otpType });
    setIsVerifying(false);

    if (result.error) {
      flashBanner({ type: "error", title: "Verification failed", message: result.error });
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
      return;
    }

    const redirectTo = await getPostLoginRedirect();
    router.push(redirectTo);
    router.refresh();
  };

  const handleResend = async () => {
    if (isResending || seconds > 0 || !email) return;

    setIsResending(true);
    const result = otpType === "signup" ? await resendSignUpOtp(email) : await sendMagicLink({ email });
    setIsResending(false);

    if (result.error) {
      flashBanner({ type: "error", title: "Couldn't resend code", message: result.error });
      return;
    }

    setSeconds(RESEND_SECONDS);
    flashBanner({ type: "success", title: "Code sent", message: `We've sent a new code to ${email}.` });
  };

  return (
    <div className="min-h-screen bg-white flex flex-col relative">
      {banner && <AuthBanner type={banner.type} title={banner.title} message={banner.message} />}

      {/* Back arrow */}
      <Link href={backHref} className="absolute top-10 left-10 flex items-center gap-[6px] hover:opacity-70 transition-opacity">
        <IconArrowLeft />
        <span className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>Back</span>
      </Link>

      {/* Centered card */}
      <div
  className="
    flex flex-1 items-center justify-center px-6 py-20
    max-md:px-5 max-md:py-12
    max-sm:px-4 max-sm:py-8
  "
>
  <div
    className="
      w-full max-w-[500px] bg-white
      border border-[#e5e7eb] rounded-[16px]
      p-8 flex flex-col gap-8

      max-md:p-6 max-md:gap-6
      max-sm:p-5 max-sm:rounded-[14px] max-sm:gap-5
    "
  >
    {/* Icon */}
    <div className="flex flex-col items-center gap-4 max-sm:gap-3">
      <div className="p-4 max-sm:p-2">
        <div
          className="
            bg-white border border-[#c2d5d0]
            rounded-full p-[14px]
            shadow-[0px_2px_4px_0px_rgba(179,212,253,0.04)]
            flex items-center justify-center

            max-sm:p-3
          "
        >
          <IconMailEnvelope />
        </div>
      </div>

      {/* Header text */}
      <div className="flex flex-col gap-2 items-center text-center w-full">
        <p
          className="
            text-[24px] leading-[28px]
            tracking-[-0.24px] text-[#0d0d12] w-full

            max-sm:text-[20px]
            max-sm:leading-[26px]
            max-sm:tracking-[-0.2px]
          "
          style={{ ...poppins, fontWeight: 500 }}
        >
          OTP Verification
        </p>

        <p
          className="
            text-[16px] leading-[24px]
            tracking-[-0.16px] text-[#666d80] w-full

            max-sm:text-[14px]
            max-sm:leading-[21px]
            max-sm:tracking-[-0.14px]
          "
          style={{ ...mont, fontWeight: 400 }}
        >
          We have sent a verification code to email address{" "}
          <span
            className="font-medium text-[#0d0d12] break-all"
            style={mont}
          >
            {email}
          </span>
        </p>
      </div>
    </div>

    {/* OTP inputs */}
    <div className="flex gap-4 max-md:gap-3 max-sm:gap-2">
      {otp.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            inputRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className={`
            flex-1 min-w-0 w-0 h-[52px]
            text-center text-[24px] leading-[28px]
            tracking-[-0.24px] text-[#0d0d12]
            rounded-[12px] border outline-none transition-colors

            max-sm:h-[46px]
            max-sm:text-[20px]
            max-sm:leading-[24px]
            max-sm:rounded-[10px]

            ${
              digit
                ? "bg-[#f8fafc] border-[#1e4f86]"
                : "bg-white border-[#dfe1e7] focus:border-[#1e4f86] focus:bg-[#f8fafc]"
            }
          `}
          style={{ ...poppins, fontWeight: 500 }}
        />
      ))}
    </div>

    {/* Verify button */}
    <button
      type="button"
      onClick={handleVerify}
      disabled={isVerifying}
      className="
        w-full bg-[#1e4f86] text-white
        text-[16px] leading-[24px]
        tracking-[-0.16px] font-medium
        rounded-[12px] h-[52px]
        flex items-center justify-center
        hover:bg-[#1b487a] transition-colors
        disabled:opacity-60

        max-sm:h-[48px]
        max-sm:text-[14px]
        max-sm:leading-[20px]
        max-sm:rounded-[10px]
      "
      style={mont}
    >
      {isVerifying ? "Verifying…" : "Verify"}
    </button>

    {/* Resend */}
    <p
      className="
        text-[16px] leading-[24px]
        text-[#666d80] text-center

        max-sm:text-[14px]
        max-sm:leading-[20px]
      "
      style={{ ...mont, fontWeight: 400 }}
    >
      {seconds > 0 ? (
        <>
          Resend code in{" "}
          <span
            className="text-[#1e4f86] font-medium"
            style={mont}
          >
            {formatTime(seconds)}
          </span>
        </>
      ) : (
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="
            text-[#1e4f86] font-medium
            hover:underline disabled:opacity-60
          "
          style={mont}
        >
          {isResending ? "Sending…" : "Resend code"}
        </button>
      )}
    </p>
  </div>
</div>

      {/* Footer */}
      <div
  className="
    shrink-0 flex items-center justify-between px-8 pb-8

    max-md:flex-col
    max-md:items-center
    max-md:gap-4
    max-md:px-5
    max-md:pb-5

    max-sm:px-4
  "
>
  <span
    className="
      text-[14px] leading-[20px]
      tracking-[-0.14px] text-[#666d80]

      max-md:text-center
      max-sm:text-[12px]
      max-sm:leading-[18px]
    "
    style={{ ...mont, fontWeight: 400 }}
  >
    © 2026 Ulrich. All rights reserved.
  </span>

  <div
    className="
      flex items-center gap-6

      max-md:flex-wrap
      max-md:justify-center
      max-md:gap-x-5
      max-md:gap-y-3

      max-sm:gap-x-3
    "
  >
    {[
      { icon: <IconShield />, label: "Privacy", href: "/privacy-policy" },
      { icon: <IconFile />, label: "Terms", href: "/terms-conditions" },
      { icon: <IconHelp />, label: "Get help", href: "/help" },
    ].map(({ icon, label, href }) => (
      <Link
        key={label}
        href={href}
        className="
          flex items-center gap-[6px]
          text-[#666d80]
          transition-colors
          hover:text-[#0d0d12]
        "
      >
        {icon}

        <span
          className="
            text-[14px] leading-[20px]
            tracking-[-0.14px]

            max-sm:text-[12px]
            max-sm:leading-[18px]
          "
          style={{ ...mont, fontWeight: 400 }}
        >
          {label}
        </span>
      </Link>
    ))}
  </div>
</div>
    </div>
  );
}
