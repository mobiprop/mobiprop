import Link from "next/link";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

export function NotFoundPage() {
  return (
  <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden lg:min-h-[720px]">
    <p
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 select-none text-center text-[180px] font-bold leading-none text-[#f5f7fa] sm:text-[320px] lg:text-[720px]"
      style={{
        fontFamily: poppins,
        letterSpacing: "-0.02em",
        backdropFilter: "brightness(1.5)",
      }}
    >
      404
    </p>

    <div className="relative mx-auto flex max-w-[1000px] flex-col items-center gap-6 px-5 py-10 text-center sm:gap-10 sm:px-6 sm:py-16">
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        <p
          className="text-[14px] font-medium tracking-[-0.14px] text-[#6a7282] sm:text-[18px] sm:tracking-[-0.18px]"
          style={{ fontFamily: poppins }}
        >
          OOPS! PAGE NOT FOUND
        </p>

        <h1
          className="text-[26px] font-semibold leading-[30px] tracking-[-0.28px] text-[#0d2138] sm:text-[48px] sm:leading-[1.15] sm:tracking-[-0.64px] lg:text-[64px] lg:leading-[76px]"
          style={{ fontFamily: poppins }}
        >
          We can&apos;t seem to find the page you&apos;re looking for.
        </h1>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Link
          href="/"
          className="rounded-[40px] bg-[#4896b6] px-5 py-3 text-[14px] font-medium tracking-[-0.14px] text-white transition-colors hover:bg-[#3d7e9b] sm:px-[26px] sm:py-[13px] sm:text-[16px] sm:tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          Back to home
        </Link>

        <Link
          href="/contact"
          className="rounded-[32px] bg-[#1e4f86] px-5 py-3 text-[14px] font-medium tracking-[-0.14px] text-white transition-colors hover:bg-[#1b487a] sm:px-[26px] sm:py-[13px] sm:text-[16px] sm:tracking-[-0.16px]"
          style={{ fontFamily: montserrat }}
        >
          Contact Support
        </Link>
      </div>
    </div>
  </section>
);
}
