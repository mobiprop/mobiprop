import Image from "next/image";
import Link from "next/link";

type AuthLogoProps = {
  className?: string;
};

export function AuthLogo({ className = "shrink-0 px-10" }: AuthLogoProps) {
  return (
    <div className={className}>
      <Link href="/" aria-label="Inicio de Mobi Prop">
        <Image src="/mobi-prop-logo-color.svg" alt="Mobi Prop" width={140} height={44} style={{ height: "auto" }} />
      </Link>
    </div>
  );
}
