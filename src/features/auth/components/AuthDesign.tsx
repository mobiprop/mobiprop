"use client";

import { useId, type ReactNode, type InputHTMLAttributes } from "react";
import Link from "next/link";
import styles from "./AuthDesign.module.css";

export { styles };
export function AuthIcon({ name }: { name: string }) {
  return <img className={styles.icon} src={`/auth/${name}.svg`} alt="" width={20} height={20} />;
}
export function AuthShell({ children, centered = false }: { children: ReactNode; centered?: boolean }) {
  return <div className={`${styles.shell} ${centered ? styles.centered : ""}`}>
    <Link className={styles.logo} href="/" aria-label="Inicio de Mobi Prop"><img src="/auth/logo.svg" alt="" width={30} height={30} /><div>Mobi <span>Prop</span></div></Link>
    <main className={styles.main}>{children}</main>
    {!centered && <div className={styles.photo}><img src="/auth/photo.webp" alt="Edificio mediterráneo blanco con persianas azules" width={704} height={948} fetchPriority="high" /></div>}
    <footer className={styles.footer}><span>© 2026 Mobi Prop. Todos los derechos reservados</span><Link href="/privacy-policy">Privacidad</Link><Link href="/terms-conditions">Términos</Link></footer>
  </div>;
}
export function AuthField({ label, icon, reveal, onReveal, invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; icon: string; reveal?: boolean; onReveal?: () => void; invalid?: boolean }) {
  const id = useId();
  return <div className={styles.field}><label htmlFor={id}>{label}{props.required && <span className={styles.required}>*</span>}</label>
    <div className={`${styles.input} ${onReveal ? styles.password : ""}`} data-invalid={invalid || undefined}>
      <AuthIcon name={icon} /><input {...props} id={id} aria-invalid={invalid || undefined} />
      {onReveal && <button className={styles.eye} type="button" onClick={onReveal} aria-label={reveal ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={reveal}><AuthIcon name="eye" /></button>}
    </div></div>;
}
export function AuthSocials({ onGoogle, disabled }: { onGoogle: () => void; disabled: boolean }) {
  return <><div className={styles.divider}>O</div><div className={styles.socials}>
    <button type="button" disabled title="El acceso con Apple todavía no está disponible" aria-label="El acceso con Apple todavía no está disponible"><AuthIcon name="apple" /></button>
    <button type="button" onClick={onGoogle} disabled={disabled} aria-label="Continuar con Google"><AuthIcon name="google" /></button>
    <button type="button" disabled title="El acceso con Microsoft todavía no está disponible" aria-label="El acceso con Microsoft todavía no está disponible"><AuthIcon name="microsoft" /></button>
  </div></>;
}
export function AuthBack({ href = "/login" }: { href?: string }) { return <Link className={styles.back} href={href}><AuthIcon name="back" />Volver</Link>; }
