import Link from "next/link";
import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthLogo } from "./components/AuthLogo";

function IconCheckCircle() {
  return (
    <div className="relative size-[103px] rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ecfdf3, #d1fae5)" }}>
      <div className="size-[85px] rounded-full bg-[#ecfdf3] flex items-center justify-center">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" stroke="#10b981" strokeWidth="2"/>
          <path d="M15 24l7 7 11-14" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  );
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5l-5 5 5 5" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function PasswordResetSuccessPageContent() {
  const mont = { fontFamily: "'Montserrat', sans-serif" };
  const poppins = { fontFamily: "'Poppins', sans-serif" };

  return (
    <div className="min-h-screen bg-white flex w-full">
      {/* ── Left panel ── */}
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px] flex flex-col items-center gap-4">
            {/* Green check icon */}
            <div className="flex items-center justify-center size-[120px]">
              <IconCheckCircle />
            </div>

            {/* Text + button */}
            <div className="flex flex-col gap-[39px] items-center w-full">
              <div className="flex flex-col gap-3 items-center text-center w-[399px]">
                <h1
                  className="text-[32px] leading-[44px] tracking-[-0.32px] text-[#0d2138]"
                  style={{ ...poppins, fontWeight: 600 }}
                >
                  Your Password has been Successfully Reset!
                </h1>
                <p
                  className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#2b3038]"
                  style={{ ...mont, fontWeight: 400 }}
                >
                  Your password has been updated securely. You can now sign in with your new password.
                </p>
              </div>

              <Link
                href="/login"
                className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-2 py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors"
                style={mont}
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom links */}
        <div className="shrink-0 flex items-center justify-between px-10">
          <Link href="/" className="flex items-center gap-[6px] text-[#6a7282] hover:text-[#0d2138] transition-colors" style={{ ...mont, fontWeight: 400, fontSize: "16px", lineHeight: "20px" }}>
            <IconArrowLeft />
            Back to home
          </Link>
          <Link href="/login" className="text-[16px] leading-[20px] font-medium text-[#2b3038] hover:text-[#1e4f86] transition-colors" style={mont}>
            Sign In
          </Link>
        </div>
      </div>

      <AuthRightPanel />
    </div>
  );
}
