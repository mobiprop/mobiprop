import Link from "next/link";

const poppins = "Poppins, sans-serif";
const montserrat = "Montserrat, sans-serif";

export function NotFoundPage() {
  return (
    <section className="relative overflow-hidden flex items-center justify-center min-h-[520px] lg:min-h-[720px]">
      <p
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 text-center font-bold leading-none text-[#f5f7fa] text-[200px] sm:text-[320px] lg:text-[420px]"
        style={{ fontFamily: poppins, letterSpacing: "-0.02em" }}
      >
        404
      </p>
      <div className="relative max-w-[1000px] mx-auto px-6 py-16 flex flex-col items-center gap-10 text-center">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[16px] sm:text-[18px] font-medium text-[#6a7282] tracking-[-0.18px]" style={{ fontFamily: poppins }}>
            OOPS! PAGE NOT FOUND
          </p>
          <h1
            className="text-[32px] sm:text-[48px] lg:text-[64px] font-semibold leading-[1.15] lg:leading-[76px] text-[#0d2138] tracking-[-0.64px]"
            style={{ fontFamily: poppins }}
          >
            We can&apos;t seem to find the page you&apos;re looking for.
          </h1>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/"
            className="px-[26px] py-[13px] rounded-[40px] bg-[#4896b6] text-white text-[16px] font-medium tracking-[-0.16px] hover:bg-[#3d7e9b] transition-colors"
            style={{ fontFamily: montserrat }}
          >
            Back to home
          </Link>
          <Link
            href="/contact"
            className="px-[26px] py-[13px] rounded-[32px] bg-[#1e4f86] text-white text-[16px] font-medium tracking-[-0.16px] hover:bg-[#1b487a] transition-colors"
            style={{ fontFamily: montserrat }}
          >
            Contact Support
          </Link>
        </div>
      </div>
    </section>
  );
}
