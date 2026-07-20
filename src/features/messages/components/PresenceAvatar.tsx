import { useTranslation } from "react-i18next";

import { colorForId, initialsFor } from "@/features/messages/lib/format";

const mont = { fontFamily: "'Montserrat', sans-serif" };

export function Avatar({
  fullName,
  id,
  avatarUrl,
  size = 48,
}: {
  fullName: string | null;
  id: string;
  avatarUrl?: string | null;
  size?: number;
}) {
  const { t } = useTranslation("messages");
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={fullName ?? t("presenceAvatar.avatarAlt")}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: colorForId(id),
        fontSize: size * 0.3,
        ...mont,
      }}
    >
      {initialsFor(fullName)}
    </div>
  );
}

export function OnlineDot({ size = 12, borderSize = 2 }: { size?: number; borderSize?: number }) {
  return (
    <div
      className="absolute shrink-0 rounded-full border-white bg-[#00c950]"
      style={{ width: size, height: size, borderWidth: borderSize, borderStyle: "solid", bottom: 0, right: 0 }}
      aria-hidden="true"
    />
  );
}
