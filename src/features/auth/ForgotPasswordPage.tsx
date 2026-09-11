"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthBanner } from "./components/AuthBanner";
import { requestPasswordReset } from "./actions";


import { AuthShell, AuthField, AuthBack, styles } from "./components/AuthDesign";

export function ForgotPasswordPageContent() {
  const staff = useSearchParams().get("view") === "staff";
  const { i18n } = useTranslation("auth");
  const t = i18n.getFixedT("es", "auth");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);


  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await requestPasswordReset({ email });
    setIsSubmitting(false);

    if (result.error) {
      flashBanner({ type: "error", title: t("forgotPassword.couldntSendResetLinkTitle"), message: result.error });
      return;
    }

    flashBanner({
      type: "success",
      title: t("forgotPassword.checkYourEmailTitle"),
      message: t("forgotPassword.checkYourEmailMessage", { email }),
    });
  };

  return (
    <AuthShell>
      {banner && <AuthBanner {...banner} />}
      <div className={`${styles.card} ${styles.forgot}`}>
        <header className={styles.header}><AuthBack href={staff ? "/dashboard-login" : "/login"} /><h1>Restablecer contraseña</h1><p>Ingresá tu correo para restablecer tu contraseña.</p></header>
        <form className={styles.form} onSubmit={e=>{e.preventDefault();void handleSubmit();}}>
          <div className={styles.fields}><AuthField label="Correo electrónico" icon="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Ingresá tu correo electrónico" /><p className={styles.helper}>Ingresá el correo con el que te registraste</p></div>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>{isSubmitting ? "Enviando…" : "Enviar correo de recuperación"}</button>
        </form>
      </div>
    </AuthShell>
  );
}
