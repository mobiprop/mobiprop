"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AuthRightPanel } from "./components/AuthRightPanel";
import { AuthBanner } from "./components/AuthBanner";
import { AuthLogo } from "./components/AuthLogo";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="6.25" r="3.333" stroke="#868c98" strokeWidth="1.25"/>
      <path d="M3.333 16.667a6.667 6.667 0 0113.334 0" stroke="#868c98" strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  );
}

function IconEnvelope() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M14.167 17.083H5.833c-2.5 0-4.166-1.25-4.166-4.166V7.083c0-2.916 1.666-4.166 4.166-4.166h8.334c2.5 0 4.166 1.25 4.166 4.166v5.834c0 2.916-1.666 4.166-4.166 4.166z" stroke="#868c98" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M14.167 7.5l-3.116 2.5c-1.025.817-2.717.817-3.742 0L4.167 7.5" stroke="#868c98" strokeWidth="1.25" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path d="M18.333 14.617v2.5a1.667 1.667 0 01-1.817 1.666 16.483 16.483 0 01-7.183-2.554 16.25 16.25 0 01-5-5 16.483 16.483 0 01-2.554-7.217A1.666 1.666 0 013.439 1.667h2.5a1.667 1.667 0 011.667 1.433c.105.8.3 1.586.583 2.342a1.667 1.667 0 01-.375 1.758L6.692 8.225a13.333 13.333 0 005 5l1.025-1.025a1.667 1.667 0 011.758-.375c.756.283 1.542.478 2.342.583a1.667 1.667 0 011.516 1.692z" stroke="#868c98" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

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

function IconSpinner() {
  return (
    <svg className="animate-spin" width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1e4f86" strokeWidth="3" />
      <path className="opacity-75" d="M22 12a10 10 0 00-10-10" stroke="#1e4f86" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <div className="size-12 rounded-full bg-[#dcfce7] flex items-center justify-center">
      <svg width="24" height="24" viewBox="0 0 20 20" fill="none">
        <path d="M3 10.5l4 4 10-10" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

// ── Field ─────────────────────────────────────────────────────────────────────

const mont = { fontFamily: "'Montserrat', sans-serif" };
const poppins = { fontFamily: "'Poppins', sans-serif" };

function Field({
  label,
  required = true,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-[4px]">
      <label className="flex items-center gap-px text-[14px] leading-[20px] tracking-[-0.14px] font-medium text-[#6a7282]" style={mont}>
        {label}
        {required && <span className="text-[#df1c41]" style={{ fontFamily: "'Inter', sans-serif" }}>*</span>}
      </label>
      {children}
    </div>
  );
}

const inputWrap =
  "flex items-center gap-2 bg-white border border-[#dfe1e7] rounded-[12px] pl-[12px] pr-[10px] py-4 shadow-[0px_1px_2px_0px_rgba(228,229,231,0.24)] focus-within:border-[#1e4f86] transition-colors";
const inputBase =
  "flex-1 min-w-0 text-[16px] leading-[24px] tracking-[-0.16px] text-[#818898] placeholder:text-[#818898] bg-transparent outline-none";

// ── Dead-end screen (invalid / expired / accepted / revoked / error) ───────────

function DeadEndScreen({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px] text-center">
            <h1 className="text-[28px] leading-[36px] text-[#0d0d12] mb-3" style={{ ...poppins, fontWeight: 600 }}>
              {title}
            </h1>
            <p className="text-[16px] leading-[24px] text-[#666d80] mb-6" style={{ ...mont, fontWeight: 400 }}>
              {message}
            </p>
            <Link href="/dashboard-login" className="inline-flex items-center justify-center bg-[#1e4f86] text-white text-[16px] font-medium rounded-[12px] px-6 py-[12px] hover:bg-[#1b487a] transition-colors" style={mont}>
              Go to staff login
            </Link>
          </div>
        </div>
      </div>
      <AuthRightPanel variant="staff" />
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

type ValidateResponse =
  | { valid: true; email: string; role: string; expiresAt: string }
  | { valid: false; reason: "INVALID" | "EXPIRED" | "ACCEPTED" | "REVOKED" };

type ViewState = "loading" | "form" | "success" | "error" | ValidateResponse;

const REASON_COPY: Record<"INVALID" | "EXPIRED" | "ACCEPTED" | "REVOKED", { title: string; message: string }> = {
  INVALID: {
    title: "Invitation unavailable",
    message: "This invitation link is invalid. Please check the link or ask your administrator for a new one.",
  },
  EXPIRED: {
    title: "Invitation expired",
    message: "This invitation link has expired. Please ask your administrator to send a new invitation.",
  },
  ACCEPTED: {
    title: "Invitation already used",
    message: "This invitation has already been accepted. If this is your account, sign in instead.",
  },
  REVOKED: {
    title: "Invitation revoked",
    message: "This invitation has been revoked. Please contact your administrator.",
  },
};

export function InvitePageContent({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<ViewState>("loading");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [banner, setBanner] = useState<{ type: "error" | "success"; title: string; message: string } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function validate() {
      if (!token) {
        if (!cancelled) setState({ valid: false, reason: "INVALID" });
        return;
      }
      try {
        const res = await fetch("/api/invitations/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = (await res.json()) as ValidateResponse;
        if (!cancelled) setState(data);
      } catch {
        if (!cancelled) setState("error");
      }
    }

    validate();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const flashBanner = (next: { type: "error" | "success"; title: string; message: string }) => {
    setBanner(next);
    setTimeout(() => setBanner(null), 4000);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, firstName, lastName, phone: phone || undefined, password, confirmPassword }),
      });
      const data = (await res.json()) as { success: true } | { success: false; error: string };

      if (!data.success) {
        setIsSubmitting(false);
        flashBanner({ type: "error", title: "Couldn't create your account", message: data.error });
        return;
      }

      setState("success");
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch {
      setIsSubmitting(false);
      flashBanner({ type: "error", title: "Something went wrong", message: "Please check your connection and try again." });
    }
  };

  // Loading
  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex w-full">
        <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
          <AuthLogo />
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center gap-3">
              <IconSpinner />
              <p className="text-[14px] text-[#6a7282]" style={mont}>Checking your invitation…</p>
            </div>
          </div>
        </div>
        <AuthRightPanel variant="staff" />
      </div>
    );
  }

  // Generic error (network / unexpected)
  if (state === "error") {
    return (
      <DeadEndScreen
        title="Something went wrong"
        message="We couldn't check this invitation right now. Please refresh the page and try again."
      />
    );
  }

  // Success
  if (state === "success") {
    return (
      <div className="min-h-screen bg-[#f9fafb] flex w-full">
        <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
          <AuthLogo />
          <div className="flex flex-1 items-center justify-center px-6">
            <div className="flex flex-col items-center text-center gap-3 max-w-[400px]">
              <IconCheck />
              <h1 className="text-[24px] leading-[28px] text-[#0d0d12]" style={{ ...poppins, fontWeight: 600 }}>
                Account created
              </h1>
              <p className="text-[16px] leading-[24px] text-[#666d80]" style={{ ...mont, fontWeight: 400 }}>
                Taking you to your dashboard…
              </p>
            </div>
          </div>
        </div>
        <AuthRightPanel variant="staff" />
      </div>
    );
  }

  // Invalid / expired / accepted / revoked
  if (typeof state === "object" && !state.valid) {
    const copy = REASON_COPY[state.reason];
    return <DeadEndScreen title={copy.title} message={copy.message} />;
  }

  // Valid invite — show the registration form
  const { email, role } = state as Extract<ValidateResponse, { valid: true }>;

  return (
    <div className="min-h-screen bg-[#f9fafb] flex w-full">
      {banner && <AuthBanner type={banner.type} title={banner.title} message={banner.message} />}

      <div className="flex flex-col flex-1 min-h-screen pt-8 pb-7">
        <AuthLogo />

        <div className="flex flex-1 items-center justify-center px-6">
          <div className="w-full max-w-[475px]">
            {/* Heading */}
            <div className="mb-[24px]">
              <h1 className="text-[24px] leading-[28px] tracking-[-0.24px] text-[#0d0d12] mb-[2px]" style={{ ...poppins, fontWeight: 600 }}>
                Create New Account
              </h1>
              <p className="text-[16px] leading-[24px] tracking-[-0.16px] text-[#666d80]" style={{ ...poppins, fontWeight: 400 }}>
                You&apos;ve been invited as {role.charAt(0) + role.slice(1).toLowerCase()}. Enter your details to sign up.
              </p>
            </div>

            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name">
                  <div className={inputWrap}>
                    <IconUser />
                    <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" className={inputBase} style={{ ...mont, fontWeight: 400 }} />
                  </div>
                </Field>

                <Field label="Last Name">
                  <div className={inputWrap}>
                    <IconUser />
                    <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" className={inputBase} style={{ ...mont, fontWeight: 400 }} />
                  </div>
                </Field>
              </div>

              <div className="flex flex-col gap-5">
                <Field label="Email Address">
                  <div className={`${inputWrap} bg-[#f3f4f6] focus-within:border-[#dfe1e7]`}>
                    <IconEnvelope />
                    <input value={email} readOnly disabled className={`${inputBase} text-[#6a7282] cursor-not-allowed`} style={{ ...mont, fontWeight: 400 }} />
                  </div>
                </Field>

                <Field label="Phone Number" required={false}>
                  <div className={inputWrap}>
                    <IconPhone />
                    <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Enter your phone number" className={inputBase} style={{ ...mont, fontWeight: 400 }} />
                  </div>
                </Field>

                <Field label="Password">
                  <div className={inputWrap}>
                    <IconLock />
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" className={inputBase} style={{ ...mont, fontWeight: 400 }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0"><IconEye visible={showPassword} /></button>
                  </div>
                </Field>

                <Field label="Confirm Password">
                  <div className={inputWrap}>
                    <IconLock />
                    <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className={inputBase} style={{ ...mont, fontWeight: 400 }} />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="shrink-0"><IconEye visible={showConfirm} /></button>
                  </div>
                </Field>
              </div>

              {/* Submit */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-[#1e4f86] border border-[#1b487a] text-white text-[16px] leading-[24px] tracking-[-0.16px] font-medium rounded-[12px] px-2 py-[14px] flex items-center justify-center hover:bg-[#1b487a] transition-colors disabled:bg-[#b9c8d9] disabled:border-[#b9c8d9]"
                style={mont}
              >
                {isSubmitting ? "Please wait…" : "Create account"}
              </button>

              {/* Bottom link */}
              <p className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] text-center" style={{ ...mont, fontWeight: 400 }}>
                Already have an account?{" "}
                <Link href="/dashboard-login" className="font-medium text-[#1e4f86] hover:underline" style={mont}>Sign In</Link>
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-[14px] px-10 max-sm:w-full max-sm:flex-wrap max-sm:justify-center max-sm:gap-x-2 max-sm:gap-y-1 max-sm:px-4 max-sm:py-3">
  <span
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap max-sm:w-full max-sm:text-center max-sm:text-[12px] max-sm:leading-[18px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    © 2026 Ulrich Propiedades
  </span>

  <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:hidden" />

  <Link
    href="/privacy-policy"
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    Privacy
  </Link>

  <div className="w-px h-[14px] bg-[#d1d5dc] max-sm:h-[12px]" />

  <Link
    href="/terms-conditions"
    className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282] whitespace-nowrap hover:text-[#0d2138] max-sm:text-[12px] max-sm:leading-[18px]"
    style={{ ...mont, fontWeight: 400 }}
  >
    Terms
  </Link>
</div>
      </div>

      <AuthRightPanel variant="staff" />
    </div>
  );
}
