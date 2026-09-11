"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { AuthBanner } from "./components/AuthBanner";
import { requestPasswordReset } from "./actions";


import { AuthShell, AuthField, AuthBack, styles } from "./components/AuthDesign";

export function ForgotPasswordPageContent() {
  const { t } = useTranslation("auth");
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
        <header className={styles.header}><AuthBack /><h1>Reset Password</h1><p>Enter your email to reset your password.</p></header>
        <form className={styles.form} onSubmit={e=>{e.preventDefault();void handleSubmit();}}>
          <div className={styles.fields}><AuthField label="Email Address" icon="email" required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Enter your email address" /><p className={styles.helper}>Enter the email with which you&apos;ve registered</p></div>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>{isSubmitting ? "Sending…" : "Forgot Password"}</button>
        </form>
      </div>
    </AuthShell>
  );
}
