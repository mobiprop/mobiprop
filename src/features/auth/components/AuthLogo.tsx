import Image from "next/image";
import Link from "next/link";

type AuthLogoProps = {
  className?: string;
};

export function AuthLogo({ className = "shrink-0 px-10" }: AuthLogoProps) {
  return (
    <div className={className}>
      <Link href="/" aria-label="Ulrich Propiedades home">
        <Image src="/logo.svg" alt="Ulrich Propiedades" width={120} height={44} style={{ height: "auto" }} />
      </Link>
    </div>
  );
}
