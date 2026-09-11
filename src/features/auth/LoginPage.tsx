"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { AuthBanner } from "./components/AuthBanner";
import {
  getPostLoginRedirect,
  sendMagicLink,
  signInWithPassword,
} from "./actions";
import { signInWithOAuth } from "./oauth";


import { AuthShell, AuthField, AuthSocials, styles } from "./components/AuthDesign";

export function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { i18n } = useTranslation("auth");
  const t = i18n.getFixedT("es", "auth");

  // Flags set by server-side flows (auth callback, layout guards) that land
  // the user back here with context about why.
  const URL_ERROR_BANNERS: Record<string, { title: string; message: string }> = {
    account_not_active: {
      title: t("urlErrors.accountNotActiveTitle"),
      message: t("urlErrors.accountNotActiveMessage"),
    },
    auth_callback_error: {
      title: t("urlErrors.authCallbackErrorTitle"),
      message: t("urlErrors.authCallbackErrorMessage"),
    },
    staff_use_dashboard: {
      title: t("urlErrors.staffUseDashboardTitle"),
      message: t("urlErrors.staffUseDashboardMessage"),
    },
    profile_missing: {
      title: t("urlErrors.profileMissingTitle"),
      message: t("urlErrors.profileMissingMessage"),
    },
  };
  const urlError = URL_ERROR_BANNERS[searchParams.get("error") ?? ""];

  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [showPassword, setShowPassword] = useState(false);
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t("login.defaultErrorMessage"));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOAuthSubmitting, setIsOAuthSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    type: "error" | "success";
    title: string;
    message: string;
  } | null>(urlError ? { type: "error", ...urlError } : null);

  const flashBanner = (banner: {
    type: "error" | "success";
    title: string;
    message: string;
  }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    if (isOAuthSubmitting || isSubmitting) return;
    setIsOAuthSubmitting(true);
    const result = await signInWithOAuth(provider);
    if (result.error) {
      setIsOAuthSubmitting(false);
      flashBanner({ type: "error", title: t("login.signInFailedTitle"), message: result.error });
    }
    // On success the SDK redirects the browser — no further action needed.
  };

  const handleLogin = async () => {
    if (isSubmitting) return;

    if (mode === "magic-link") {
      if (!email) {
        flashBanner({
          type: "error",
          title: t("login.emailRequiredTitle"),
          message: t("login.emailRequiredMessage"),
        });
        return;
      }

      setIsSubmitting(true);
      const result = await sendMagicLink({ email });
      setIsSubmitting(false);

      if (result.error) {
        flashBanner({
          type: "error",
          title: t("login.couldntSendMagicLinkTitle"),
          message: result.error,
        });
        return;
      }

      router.push(
        `/verify-otp?email=${encodeURIComponent(email)}&type=email&context=login`,
      );
      return;
    }

    if (!email || !password) {
      setHasError(true);
      setErrorMessage(t("login.missingDetailsMessage"));
      flashBanner({
        type: "error",
        title: t("login.missingDetailsTitle"),
        message: t("login.missingDetailsMessage"),
      });
      return;
    }

    setIsSubmitting(true);
    const result = await signInWithPassword({ email, password });

    if (result.error) {
      setIsSubmitting(false);
      setHasError(true);
      setErrorMessage(result.error);
      flashBanner({
        type: "error",
        title: t("login.couldntSignInTitle"),
        message: result.error,
      });
      return;
    }

    // Hard navigation on purpose: the auth cookies just changed, and a soft
    // router.push can render stale logged-out UI from the router cache.
    const redirectTo = await getPostLoginRedirect();
    window.location.assign(redirectTo);
  };


  return (
    <AuthShell>
      {banner && <AuthBanner {...banner} />}
      <div className={`${styles.card} ${styles.login}`}>
        <header className={styles.header}><h1>Te damos la bienvenida</h1><p>Iniciá sesión para continuar</p></header>
        <form className={styles.form} onSubmit={e=>{e.preventDefault();void handleLogin();}}>
          <div className={styles.fields}>
            <AuthField label="Correo electrónico" icon="email" required type="email" autoComplete="email" value={email} onChange={e=>{setEmail(e.target.value);setHasError(false);}} placeholder="Ingresá tu correo electrónico" invalid={hasError} />
            {mode === "password" && <AuthField label="Contraseña" icon="lock" required type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e=>{setPassword(e.target.value);setHasError(false);}} placeholder="••••••••••" reveal={showPassword} onReveal={()=>setShowPassword(v=>!v)} invalid={hasError} />}
            {hasError && <p className={styles.error} role="alert">{errorMessage}</p>}
          </div>
          <div className={styles.actions}>
            <button className={styles.primary} type="submit" disabled={isSubmitting || isOAuthSubmitting}>{isSubmitting ? "Esperá un momento…" : mode === "password" ? "Iniciar sesión" : "Enviar código de acceso"}</button>
            <div className={styles.support}><label><input type="checkbox" checked={keepLoggedIn} onChange={e=>setKeepLoggedIn(e.target.checked)} />Mantene mi sesión</label><Link href="/reset-password">¿Olvidaste tu contraseña?</Link></div>
          </div>
          <AuthSocials onGoogle={()=>void handleOAuth("google")} disabled={isSubmitting || isOAuthSubmitting} />
          <p className={styles.account}>¿No tenés una cuenta? <Link href="/register">Creá una</Link></p>
          <button type="button" className={styles.helper} style={{textDecoration: "underline", textUnderlineOffset: "3px"}} onClick={()=>{setMode(mode === "password" ? "magic-link" : "password");setHasError(false);}}>{mode === "password" ? "Ingresar con un código por correo" : "Ingresar con contraseña"}</button>
        </form>
      </div>
    </AuthShell>
  );
}
