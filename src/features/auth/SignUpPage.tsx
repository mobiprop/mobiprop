"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { signUpWithPassword } from "./actions";
import { signInWithOAuth } from "./oauth";
import { AuthBanner } from "./components/AuthBanner";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────


import { AuthShell, AuthField, AuthSocials, styles } from "./components/AuthDesign";

export function SignUpPageContent() {
  const router = useRouter();
  const { t } = useTranslation("auth");
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
      flashBanner(t("signup.signInFailedTitle"), result.error);
    }
  };

  const handleSignUp = async () => {
    if (isSubmitting) return;

    if (!fullName || !email || !password) {
      setBanner({
        title: t("signup.missingInfoTitle"),
        message: t("signup.missingInfoMessage"),
      });
      setTimeout(() => setBanner(null), 4000);
      return;
    }

    setIsSubmitting(true);
    const result = await signUpWithPassword({ fullName, email, password });
    setIsSubmitting(false);

    if (result.error) {
      setBanner({
        title: t("signup.couldntCreateAccountTitle"),
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
    <AuthShell>
      {banner && <AuthBanner type="error" title={banner.title} message={banner.message} />}
      <div className={styles.card}>
        <header className={styles.header}><h1>Sign Up</h1><p>Sign up to continue to your dashboard</p></header>
        <form className={styles.form} onSubmit={e => { e.preventDefault(); void handleSignUp(); }}>
          <div className={styles.fields}>
            <AuthField label="Full Name" icon="user" required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Enter your full name" />
            <AuthField label="Email Address" icon="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" />
            <AuthField label="Password" icon="lock" required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" reveal={showPassword} onReveal={()=>setShowPassword(v=>!v)} />
          </div>
          <div className={styles.actions}><button className={styles.primary} type="submit" disabled={isSubmitting || isOAuthSubmitting}>{isSubmitting ? t("signup.creatingAccount") : "Sign Up"}</button><div className={styles.support}><Link href="/reset-password">Forgot password?</Link></div></div>
          <AuthSocials onGoogle={()=>void handleOAuth("google")} disabled={isSubmitting || isOAuthSubmitting} />
          <p className={styles.account}>Already have an account? <Link href="/login">Sign in</Link></p>
        </form>
      </div>
    </AuthShell>
  );
}
