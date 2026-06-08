"use client";

type AuthBannerProps = {
  type: "error" | "success";
  title: string;
  message: string;
  onClose?: () => void;
};

function IconCircleX() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#e7000b" strokeWidth="1.5"/>
      <path d="M15 9l-6 6M9 9l6 6" stroke="#e7000b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

function IconCircleCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5"/>
      <path d="M8 12l3 3 5-5" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function AuthBanner({ type, title, message }: AuthBannerProps) {
  const isError = type === "error";
  return (
    <div className="fixed top-8 right-16 z-50 bg-white rounded-[16px] shadow-[0px_8px_12px_rgba(16,24,40,0.12)] flex flex-col items-start pb-px pt-[17px] px-[25px] w-[400px]">
      <div className="flex gap-4 h-12 items-center w-full">
        <div className={`${isError ? "bg-[#fef3f2]" : "bg-[#ecfdf5]"} rounded-full shrink-0 size-12 flex items-center justify-center`}>
          {isError ? <IconCircleX /> : <IconCircleCheck />}
        </div>
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <p
            className="font-medium text-[16px] leading-[24px] tracking-[-0.16px] text-[#232323]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {title}
          </p>
          <p
            className="text-[14px] leading-[20px] tracking-[-0.14px] text-[#6a7282]"
            style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 400 }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
