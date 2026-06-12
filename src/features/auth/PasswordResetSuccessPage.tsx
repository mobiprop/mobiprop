import Image from "next/image";
import Link from "next/link";
import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthLogo } from "./components/AuthLogo";

function IconCheckCircle() {
  return (
    <div
      className="relative flex size-[88px] items-center justify-center rounded-full sm:size-[96px] lg:size-[103px]"
      style={{
        background: "linear-gradient(135deg, #ecfdf3, #d1fae5)",
      }}
    >
      <div className="flex size-[72px] items-center justify-center rounded-full bg-[#ecfdf3] sm:size-[78px] lg:size-[85px]">
        <svg
          className="size-10 sm:size-11 lg:size-12"
          viewBox="0 0 48 48"
          fill="none"
        >
          <circle
            cx="24"
            cy="24"
            r="20"
            stroke="#10b981"
            strokeWidth="2"
          />
          <path
            d="M15 24l7 7 11-14"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M12.5 5l-5 5 5 5"
        stroke="#6a7282"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PasswordResetSuccessPageContent() {
  const mont = {
    fontFamily: "'Montserrat', sans-serif",
  };

  const poppins = {
    fontFamily: "'Poppins', sans-serif",
  };

  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Left panel */}
      <div className="flex min-h-screen w-full flex-col px-5 pb-5 pt-5 sm:px-8 sm:pb-7 sm:pt-7 lg:flex-1 lg:px-0 lg:pt-8">
        <AuthLogo />

        <main className="flex flex-1 items-center justify-center py-8 sm:px-6 sm:py-10 lg:py-6">
          <div className="flex w-full max-w-[475px] flex-col items-center gap-4">
            {/* Green check icon */}
            <div className="flex size-[100px] items-center justify-center sm:size-[110px] lg:size-[120px]">
              <Image
    src="/assets/figma-temp/UserProfile/check-icon.svg"
    alt="Password reset successful"
    width={103}
    height={103}
    priority
    className="size-[88px] sm:size-[96px] lg:size-[103px]"
  />
            </div>

            {/* Text and button */}
            <div className="flex w-full flex-col items-center gap-8 sm:gap-[39px]">
              <div className="flex w-full max-w-[399px] flex-col items-center gap-3 text-center">
                <h1
                  className="text-[25px] leading-[34px] tracking-[-0.25px] text-[#0d2138] sm:text-[28px] sm:leading-[39px] lg:text-[32px] lg:leading-[44px] lg:tracking-[-0.32px]"
                  style={{
                    ...poppins,
                    fontWeight: 600,
                  }}
                >
                  Your Password has been Successfully Reset!
                </h1>

                <p
                  className="max-w-[420px] text-[14px] leading-[22px] tracking-[-0.14px] text-[#2b3038] sm:text-[15px] sm:leading-[23px] lg:text-[16px] lg:leading-[24px] lg:tracking-[-0.16px]"
                  style={{
                    ...mont,
                    fontWeight: 400,
                  }}
                >
                  Your password has been updated securely. You can now sign in
                  with your new password.
                </p>
              </div>

              <Link
                href="/login"
                className="flex w-full items-center justify-center rounded-[12px] border border-[#1b487a] bg-[#1e4f86] px-4 py-[13px] text-[15px] font-medium leading-[24px] tracking-[-0.15px] text-white transition-colors hover:bg-[#1b487a] sm:py-[14px] sm:text-[16px] sm:tracking-[-0.16px]"
                style={mont}
              >
                Sign In
              </Link>
            </div>
          </div>
        </main>

        {/* Bottom links */}
        <footer className="flex shrink-0 items-center justify-between gap-4 sm:px-2 lg:px-10">
          <Link
            href="/"
            className="flex items-center gap-[6px] whitespace-nowrap text-[#6a7282] transition-colors hover:text-[#0d2138]"
            style={{
              ...mont,
              fontWeight: 400,
              fontSize: "14px",
              lineHeight: "20px",
            }}
          >
            <IconArrowLeft />
            Back to home
          </Link>

          <Link
            href="/login"
            className="whitespace-nowrap text-[14px] font-medium leading-[20px] text-[#2b3038] transition-colors hover:text-[#1e4f86] sm:text-[16px]"
            style={mont}
          >
            Sign In
          </Link>
        </footer>
      </div>

      {/* Right panel only on desktop */}
      <div className="hidden lg:block">
        <AuthRightPanel />
      </div>
    </div>
  );
}