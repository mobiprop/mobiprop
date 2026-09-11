import { resolveAppUrl } from "./app-url";

export const APP_NAME = "Mobi Prop";
export const APP_URL = resolveAppUrl(process.env.NEXT_PUBLIC_APP_URL, process.env.NODE_ENV === "production");
