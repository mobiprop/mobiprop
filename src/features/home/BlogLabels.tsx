"use client";

import { useTranslation } from "react-i18next";

export function ReadArticleLabel() {
  const { t } = useTranslation("home");
  return <>{t("blog.readArticle")}</>;
}

export function ReadMoreLabel() {
  const { t } = useTranslation("home");
  return <>{t("blog.readMore")}</>;
}
