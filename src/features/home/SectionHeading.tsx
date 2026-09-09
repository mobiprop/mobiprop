import { SplitHeading } from "@/components/common/SplitHeading";

/** Shared Figma section header: full-width rules, title, then supporting copy. */
export function SectionHeading({ badge, title, subtitle }: {
  badge: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="home-section-heading">
      <div className="home-section-eyebrow"><span />{badge}<span /></div>
      <SplitHeading as="h2" text={title} className="home-section-title" />
      <p className="home-section-description">{subtitle}</p>
    </div>
  );
}
