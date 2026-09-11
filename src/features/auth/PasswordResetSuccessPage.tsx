"use client";
import Link from "next/link";
import { AuthShell, AuthIcon, styles } from "./components/AuthDesign";
export function PasswordResetSuccessPageContent() {
  return <AuthShell centered><div className={`${styles.card} ${styles.success}`}>
    <header className={styles.header}><div className={styles.successIcon}><AuthIcon name="success" /></div><h1>¡Restableciste tu contraseña!</h1><p>Tu contraseña se actualizó de forma segura. Ya podés iniciar sesión con tu nueva contraseña.</p></header>
    <Link className={styles.primary} href="/login">Iniciar sesión</Link>
  </div></AuthShell>;
}
