"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h2 className="text-2xl font-semibold text-[#0d2138]" style={{ fontFamily: "Poppins, sans-serif" }}>
        Ocurrió un error
      </h2>
      <button
        onClick={reset}
        className="px-6 py-2 rounded-full text-white text-sm"
        style={{ background: "linear-gradient(to bottom, #005ea4, #006fc2)", fontFamily: "Montserrat, sans-serif" }}
      >
        Volver a intentar
      </button>
    </div>
  );
}
