"use client";

import { CircleCheck, CircleX, X } from "lucide-react";
import styles from "./BrandedNotification.module.css";

export type BrandedNotificationProps = {
  type: "error" | "success";
  title: string;
  message: string;
  onClose?: () => void;
};

export function BrandedNotification({type, title, message, onClose}: BrandedNotificationProps) {
  const error = type === "error";
  const Icon = error ? CircleX : CircleCheck;
  return <div className={styles.banner} role={error ? "alert" : "status"} aria-atomic="true">
    <span className={`${styles.icon} ${error ? styles.error : styles.success}`} aria-hidden="true"><Icon size={24} strokeWidth={1.5}/></span>
    <div className={styles.copy}><p className={styles.title}>{title}</p><p className={styles.message}>{message}</p></div>
    {onClose && <button type="button" className={styles.close} onClick={onClose} aria-label="Cerrar notificación"><X size={16}/></button>}
  </div>;
}
