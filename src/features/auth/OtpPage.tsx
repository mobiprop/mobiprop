"use client";

import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPostLoginRedirect, resendSignUpOtp, sendMagicLink, verifyOtp } from "./actions";
import { AuthBanner } from "./components/AuthBanner";

type OtpPageProps = {
  email?: string;
  backHref?: string;
};

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;

// ── Icons ─────────────────────────────────────────────────────────────────────


import { AuthShell, AuthBack, AuthIcon, styles } from "./components/AuthDesign";

export function OtpPageContent({ email: emailProp, backHref = "/register" }: OtpPageProps) {
  const searchParams = useSearchParams();
  const { t } = useTranslation("auth");

  const email = emailProp ?? searchParams.get("email") ?? "";
  const otpType = (searchParams.get("type") === "email" ? "email" : "signup") as "email" | "signup";

  const [otp, setOtp] = useState<string[]>(Array.from({ length: OTP_LENGTH }, () => ""));
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);


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

  const fillFrom = (index: number, text: string) => {
    const digits = text.replace(/\D/g, "");
    if (!digits) return;
    const next = [...otp];
    let i = index;
    for (const d of digits) {
      if (i >= OTP_LENGTH) break;
      next[i] = d;
      i += 1;
    }
    setOtp(next);
    inputRefs.current[Math.min(i, OTP_LENGTH - 1)]?.focus();
  };

  const handleInput = (index: number, value: string) => {
    const digits = value.replace(/\D/g, "");
    // Multiple digits arrive when the code is pasted or autofilled into one box
    if (digits.length > 1) {
      fillFrom(index, digits);
      return;
    }
    const char = digits.slice(-1);
    const next = [...otp];
    next[index] = char;
    setOtp(next);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (index: number, e: React.ClipboardEvent) => {
    e.preventDefault();
    fillFrom(index, e.clipboardData.getData("text"));
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
      flashBanner({ type: "error", title: t("otp.missingEmailTitle"), message: t("otp.missingEmailMessage") });
      return;
    }
    if (token.length !== OTP_LENGTH) {
      flashBanner({
        type: "error",
        title: t("otp.incompleteCodeTitle"),
        message: t("otp.incompleteCodeMessage", { length: OTP_LENGTH }),
      });
      return;
    }

    setIsVerifying(true);
    const result = await verifyOtp({ email, token, type: otpType });

    if (result.error) {
      setIsVerifying(false);
      flashBanner({ type: "error", title: t("otp.verificationFailedTitle"), message: result.error });
      setOtp(Array.from({ length: OTP_LENGTH }, () => ""));
      inputRefs.current[0]?.focus();
      return;
    }

    // Hard navigation on purpose: the auth cookies just changed, and a soft
    // router.push racing with router.refresh can cancel the transition and
    // leave this screen stuck. Keep isVerifying=true until the page unloads.
    const redirectTo = await getPostLoginRedirect();
    window.location.assign(redirectTo);
  };

  const handleResend = async () => {
    if (isResending || seconds > 0 || !email) return;

    setIsResending(true);
    const result = otpType === "signup" ? await resendSignUpOtp(email) : await sendMagicLink({ email });
    setIsResending(false);

    if (result.error) {
      flashBanner({ type: "error", title: t("otp.couldntResendTitle"), message: result.error });
      return;
    }

    setSeconds(RESEND_SECONDS);
    flashBanner({ type: "success", title: t("otp.codeSentTitle"), message: t("otp.codeSentMessage", { email }) });
  };

  return (
    <AuthShell centered>
      {banner && <AuthBanner {...banner} />}
      <form className={`${styles.card} ${styles.otp}`} onSubmit={e=>{e.preventDefault();void handleVerify();}}>
        <header className={`${styles.header} ${styles.otpHeader}`}><div className={styles.otpIcon}><AuthIcon name="otp" /></div><div><h1>OTP Verification</h1><p>We have sent a verification code to email address <strong>{email}</strong></p></div></header>
        <div className={styles.digits}>{otp.map((digit,i)=><input key={i} ref={el=>{inputRefs.current[i]=el;}} aria-label={`Digit ${i+1} of ${OTP_LENGTH}`} inputMode="numeric" autoComplete={i===0 ? "one-time-code" : "off"} value={digit} onChange={e=>handleInput(i,e.target.value)} onKeyDown={e=>handleKeyDown(i,e)} onPaste={e=>handlePaste(i,e)} disabled={isVerifying} />)}</div>
        <button type="submit" className={styles.primary} disabled={isVerifying}>{isVerifying ? t("otp.verifying") : "Verify"}</button>
        <div className={styles.resend}>Didn&apos;t receive the code? <button type="button" onClick={()=>void handleResend()} disabled={isResending || seconds>0 || !email}>{seconds>0 ? `Resend in ${formatTime(seconds)}` : isResending ? "Sending…" : "Resend"}</button></div>
        {!email && <AuthBack href={backHref} />}
      </form>
    </AuthShell>
  );
}
