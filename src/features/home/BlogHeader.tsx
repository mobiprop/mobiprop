"use client";

import { useTranslation } from "react-i18next";
import { SectionHeading } from "./SectionHeading";

export function BlogHeader() {
  const { t } = useTranslation("home");

  return <SectionHeading badge={t("blog.badge")} title={t("blog.title")} subtitle={t("blog.subtitle")} />;
}
