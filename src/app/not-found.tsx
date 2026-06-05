export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <h1 className="text-4xl font-semibold text-[#0d2138]" style={{ fontFamily: "Poppins, sans-serif" }}>
        404
      </h1>
      <p className="text-[#6a7282]" style={{ fontFamily: "Montserrat, sans-serif" }}>
        Page not found
      </p>
    </div>
  );
}
