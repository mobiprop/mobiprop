"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AuthBanner } from "./components/AuthBanner";
import { updatePassword } from "./actions";


import { AuthShell, AuthField, AuthBack, styles } from "./components/AuthDesign";

export function NewPasswordPageContent() {
  const router = useRouter();
  const { t } = useTranslation("auth");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);


  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await updatePassword({ password, confirmPassword: confirm });
    setIsSubmitting(false);

    if (result.error) {
      flashBanner({ type: "error", title: t("newPassword.couldntUpdatePasswordTitle"), message: result.error });
      return;
    }

    router.push("/reset-success");
  };

  return (
    <AuthShell centered>
      {banner && <AuthBanner {...banner} />}
      <div className={`${styles.card} ${styles.newPassword}`}>
        <header className={styles.header}><AuthBack /><h1>Create New Password</h1><p>Enter your new password.</p></header>
        <form className={styles.form} onSubmit={e=>{e.preventDefault();void handleSubmit();}}>
          <div className={styles.fields}>
            <AuthField label="Password" icon="lock" required minLength={8} type={showPw ? "text" : "password"} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" reveal={showPw} onReveal={()=>setShowPw(v=>!v)} />
            <AuthField label="Confirm New Password" icon="lock" required minLength={8} type={showCf ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••••" reveal={showCf} onReveal={()=>setShowCf(v=>!v)} />
          </div>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>{isSubmitting ? "Updating…" : "Reset Password"}</button>
        </form>
      </div>
    </AuthShell>
  );
}
