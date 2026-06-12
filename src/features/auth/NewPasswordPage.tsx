"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthBanner } from "./components/AuthBanner";
import { AuthLogo } from "./components/AuthLogo";
import { updatePassword } from "./actions";

function IconLock() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M5 8.333V6.25a5 5 0 0110 0v2.083" stroke="#868c98" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="2.5" y="8.333" width="15" height="9.584" rx="2.5" stroke="#868c98" strokeWidth="1.25"/>
      <circle cx="10" cy="13.125" r="1.25" fill="#868c98"/>
    </svg>
  );
}

function IconEye({ visible }: { visible: boolean }) {
  if (visible) {
    return (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M12.984 10a2.984 2.984 0 11-5.968 0 2.984 2.984 0 015.968 0z" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M10 16.892c-3.534 0-6.825-2.083-9.117-5.7a3.434 3.434 0 010-3.392C3.175 4.208 6.466 2.125 10 2.125s6.825 2.083 9.117 5.675a3.434 3.434 0 010 3.392c-2.292 3.617-5.583 5.7-9.117 5.7z" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.108 7.892L7.892 12.108a2.983 2.983 0 014.216-4.216zM14.85 4.808C13.391 3.725 11.725 3.117 10 3.117 6.467 3.117 3.175 5.2.883 8.792a3.434 3.434 0 000 3.391 16.5 16.5 0 002.8 3.125M7.058 16.392c.942.392 1.934.6 2.942.6 3.534 0 6.825-2.083 9.117-5.7a3.434 3.434 0 000-3.392 17.5 17.5 0 00-1.125-1.658M13.108 10.558a2.984 2.984 0 01-2.55 2.55M7.892 12.108L1.667 18.333M18.333 1.667L13.108 6.892" stroke="#6a7282" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconArrowLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M12.5 5l-5 5 5 5" stroke="#6a7282" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function PasswordInput({
  label, value, onChange, visible, onToggle,
}: {
  label: string; value: string; onChange: (v: string) => void; visible: boolean; onToggle: () => void;
}) {
  const mont = { fontFamily: "'Montserrat', sans-serif" };
  return (
    <div className="flex flex-col gap-[4px]">
      <label className="flex items-center gap-px text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#2b3038]" style={mont}>
        {label}<span className="text-[#8b5cf6]" style={{ fontFamily: "'Inter', sans-serif" }}>*</span>
      </label>
      <div className="flex items-center gap-2 bg-white border border-[#d1d5dc] rounded-[12px] pl-[12px] pr-[10px] py-4 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors">
        <IconLock />
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="• • • • • • • • • •"
          className="flex-1 min-w-0 text-[14px] leading-[20px] tracking-[-0.084px] text-[#868c98] placeholder:text-[#868c98] bg-transparent outline-none"
          style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400 }}
        />
        <button type="button" onClick={onToggle} className="shrink-0"><IconEye visible={visible} /></button>
      </div>
    </div>
  );
}

export function NewPasswordPageContent() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);

  const mont = { fontFamily: "'Montserrat', sans-serif" };
  const poppins = { fontFamily: "'Poppins', sans-serif" };

  const flashBanner = (banner: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(banner);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const result = await updatePassword({ password, confirmPassword: confirm });
    setIsSubmitting(false);

    if (result.error) {
      flashBanner({ type: "error", title: "Couldn't update password", message: result.error });
      return;
    }

    router.push("/reset-success");
  };

  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      {banner && <AuthBanner type={banner.type} title={banner.title} message={banner.message} />}
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px]">
            {/* Back + title */}
            <div className="flex flex-col gap-4 mb-[52px]">
              <Link href="/reset-password" className="flex items-center gap-[6px] w-fit hover:opacity-70 transition-opacity">
                <IconArrowLeft />
                <span className="text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>Back</span>
              </Link>
              <div>
                <h1 className=" mb-[2px]
  text-[32px] leading-[44px]
  tracking-[-0.32px] text-[#0d2138]

  max-md:text-[30px]
  max-md:leading-[40px]
  max-md:tracking-[-0.3px]

  max-sm:text-[26px]
  max-sm:leading-[34px]
  max-sm:tracking-[-0.26px]" style={{ ...poppins, fontWeight: 600 }}>
                  Create New Password
                </h1>
                <p className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#6a7282]" style={{ ...mont, fontWeight: 400 }}>
                  Enter your new password.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-8">
              <div className="flex flex-col gap-5">
                <PasswordInput label="Password" value={password} onChange={setPassword} visible={showPw} onToggle={() => setShowPw(!showPw)} />
                <PasswordInput label="Confirm New Password" value={confirm} onChange={setConfirm} visible={showCf} onToggle={() => setShowCf(!showCf)} />
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-2 py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors disabled:opacity-60"
                style={mont}
              >
                {isSubmitting ? "Resetting…" : "Reset Password"}
              </button>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-[14px] px-10">
          <span className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap" style={{ ...mont, fontWeight: 400 }}>© 2026 Ulrich Propiedades</span>
          <div className="w-px h-[14px] bg-[#d1d5dc]" />
          <Link href="/privacy" className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138]" style={{ ...mont, fontWeight: 400 }}>Privacy</Link>
          <div className="w-px h-[14px] bg-[#d1d5dc]" />
          <Link href="/terms" className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138]" style={{ ...mont, fontWeight: 400 }}>Terms</Link>
        </div>
      </div>
      <AuthRightPanel />
    </div>
  );
}
