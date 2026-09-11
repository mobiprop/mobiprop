"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_REQUIREMENTS } from "./password-policy";
import { updatePasswordSchema } from "./schemas";
import { AuthBanner } from "./components/AuthBanner";
import { updatePassword } from "./actions";


import { AuthShell, AuthField, AuthBack, styles } from "./components/AuthDesign";

export function NewPasswordPageContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);


  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);

  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const parsed = updatePasswordSchema.safeParse({password, confirmPassword: confirm});
    if (!parsed.success) { flashBanner({type: "error", title: "Revisá la contraseña", message: parsed.error.issues[0].message}); return; }
    setBanner(null);
    setIsSubmitting(true);
    try {
      const result = await updatePassword(parsed.data);
      if (result.error) { flashBanner({type: "error", title: "No pudimos actualizar la contraseña", message: result.error}); return; }
      router.push("/reset-success");
    } catch { flashBanner({type: "error", title: "No pudimos completar la solicitud", message: "Revisá tu conexión y volvé a intentar."}); }
    finally { setIsSubmitting(false); }
  };

  return (
    <AuthShell centered>
      {banner && <AuthBanner {...banner} />}
      <div className={`${styles.card} ${styles.newPassword}`}>
        <header className={styles.header}><AuthBack /><h1>Creá una nueva contraseña</h1><p>Ingresá tu nueva contraseña.</p></header>
        <form noValidate className={styles.form} onSubmit={e=>{e.preventDefault();void handleSubmit();}}>
          <div className={styles.fields}>
            <AuthField label="Contraseña" aria-describedby="password-requirements" icon="lock" required minLength={8} type={showPw ? "text" : "password"} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••••" reveal={showPw} onReveal={()=>setShowPw(v=>!v)} />
            <p id="password-requirements" className={styles.helper}>{PASSWORD_REQUIREMENTS}</p>
            <AuthField label="Confirmá tu nueva contraseña" icon="lock" required minLength={8} type={showCf ? "text" : "password"} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="••••••••••" reveal={showCf} onReveal={()=>setShowCf(v=>!v)} />
          </div>
          <button type="submit" className={styles.primary} disabled={isSubmitting}>{isSubmitting ? "Actualizando…" : "Restablecer contraseña"}</button>
        </form>
      </div>
    </AuthShell>
  );
}
