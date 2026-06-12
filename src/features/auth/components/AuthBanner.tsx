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
      <circle cx="12" cy="12" r="10" stroke="#e7000b" strokeWidth="1.5" />
      <path
        d="M15 9l-6 6M9 9l6 6"
        stroke="#e7000b"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconCircleCheck() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="#10b981" strokeWidth="1.5" />
      <path
        d="M8 12l3 3 5-5"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AuthBanner({ type, title, message }: AuthBannerProps) {
  const isError = type === "error";
  return (
    <div
      className="
    fixed left-1/2 top-3 z-50
    w-[calc(100%-24px)] max-w-[280px]
    -translate-x-1/2
    rounded-[12px] bg-white
    px-4 py-3
    shadow-[0px_8px_12px_rgba(16,24,40,0.12)]
    sm:top-4 sm:max-w-[320px] sm:px-5
    lg:absolute lg:left-1/2 lg:top-3 lg:max-w-[240px]
    xl:max-w-[300px]
  "
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <div
          className={`
        flex size-8 shrink-0 items-center justify-center rounded-full
        sm:size-10
        ${isError ? "bg-[#fef3f2]" : "bg-[#ecfdf5]"}
      `}
        >
          {isError ? <IconCircleX /> : <IconCircleCheck />}
        </div>

        <div className="min-w-0 flex-1">
          <p
            className="
          text-[12px] font-medium leading-[18px]
          tracking-[-0.12px] text-[#232323]
          sm:text-[14px] sm:leading-[20px]
        "
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {title}
          </p>

          <p
            className="
          mt-0.5 text-[10px] leading-4
          tracking-[-0.1px] text-[#6a7282]
          sm:text-[12px] sm:leading-[18px]
        "
            style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 400,
            }}
          >
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}
