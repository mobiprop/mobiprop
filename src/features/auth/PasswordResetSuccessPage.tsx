"use client";
import Link from "next/link";
import { AuthShell, AuthIcon, styles } from "./components/AuthDesign";
export function PasswordResetSuccessPageContent() {
  return <AuthShell centered><div className={`${styles.card} ${styles.success}`}>
    <header className={styles.header}><div className={styles.successIcon}><AuthIcon name="success" /></div><h1>Your Password has been Successfully Reset!</h1><p>Your password has been updated securely. You can now sign in with your new password.</p></header>
    <Link className={styles.primary} href="/login">Sign In</Link>
  </div></AuthShell>;
}
