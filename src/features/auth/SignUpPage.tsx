"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { PASSWORD_REQUIREMENTS } from "./password-policy";
import { signUpSchema } from "./schemas";
import { signUpWithPassword } from "./actions";
import { signInWithOAuth } from "./oauth";
import { AuthBanner } from "./components/AuthBanner";

// ── Inline SVG Icons ──────────────────────────────────────────────────────────


import { AuthShell, AuthField, AuthSocials, styles } from "./components/AuthDesign";

export function SignUpPageContent() {
  const router = useRouter();
  const { i18n } = useTranslation("auth");
  const t = i18n.getFixedT("es", "auth");
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

  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    if (isOAuthSubmitting || isSubmitting) return;
    setIsOAuthSubmitting(true);
    try {
      const result = await signInWithOAuth(provider);
      if (result.error) flashBanner("No pudimos iniciar sesión", "Volvé a intentar con Google o usá tu correo electrónico.");
    } catch {
      flashBanner("No pudimos iniciar sesión", "Revisá tu conexión y volvé a intentar.");
    } finally { setIsOAuthSubmitting(false); }
  };

  const handleSignUp = async () => {
    if (isSubmitting || isOAuthSubmitting) return;
    const parsed = signUpSchema.safeParse({ fullName, email, password });
    if (!parsed.success) { setBanner({title: "Revisá los datos", message: parsed.error.issues[0].message}); return; }
    setBanner(null);
    setIsSubmitting(true);
    try {
      const result = await signUpWithPassword(parsed.data);
      if (result.error) { setBanner({title: "No pudimos crear la cuenta", message: result.error}); return; }
      router.push(`/verify-otp?email=${encodeURIComponent(parsed.data.email)}&type=signup&context=register`);
    } catch {
      setBanner({title: "No pudimos completar la solicitud", message: "Revisá tu conexión y volvé a intentar."});
    } finally { setIsSubmitting(false); }
  };

  return (
    <AuthShell>
      {banner && <AuthBanner type="error" title={banner.title} message={banner.message} />}
      <div className={styles.card}>
        <header className={styles.header}><h1>Crear cuenta</h1><p>Creá tu cuenta para continuar</p></header>
        <form noValidate className={styles.form} onSubmit={e => { e.preventDefault(); void handleSignUp(); }}>
          <div className={styles.fields}>
            <AuthField label="Nombre completo" icon="user" required autoComplete="name" value={fullName} onChange={e=>setFullName(e.target.value)} placeholder="Ingresá tu nombre completo" />
            <AuthField label="Correo electrónico" icon="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Ingresá tu correo electrónico" />
            <AuthField label="Contraseña" aria-describedby="password-requirements" icon="lock" required minLength={8} type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" reveal={showPassword} onReveal={()=>setShowPassword(v=>!v)} />
            <p id="password-requirements" className={styles.helper}>{PASSWORD_REQUIREMENTS}</p>
          </div>
          <div className={styles.actions}><button className={styles.primary} type="submit" disabled={isSubmitting || isOAuthSubmitting}>{isSubmitting ? t("signup.creatingAccount") : "Crear cuenta"}</button><div className={styles.support}><Link href="/reset-password">¿Olvidaste tu contraseña?</Link></div></div>
          <AuthSocials onGoogle={()=>void handleOAuth("google")} disabled={isSubmitting || isOAuthSubmitting} />
          <p className={styles.account}>¿Ya tenés una cuenta? <Link href="/login">Iniciá sesión</Link></p>
        </form>
      </div>
    </AuthShell>
  );
}
