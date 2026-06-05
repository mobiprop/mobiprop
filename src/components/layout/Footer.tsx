import svgPaths from "@/assets/svg-6s7nojygyu";

const footerBg = "/assets/figma-temp/HomePageFinal/3fba757107af3080a480784b8edf8f9a8a4c4646.png";

const navLinks = ["Home", "Listing", "About Us", "Blog", "Contact"];

function MailIcon() {
  return (
    <svg width="16" height="14" viewBox="0 0 14.3334 11.6667" fill="none">
      <path d={svgPaths.p3d448680} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 14.38 14.4401" fill="none">
      <path d={svgPaths.p3a452d00} stroke="white" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="16" viewBox="0 0 11.6667 14.3333" fill="none">
      <path d={svgPaths.p1fff3000} stroke="#EDF5F8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={svgPaths.p1a179d80} stroke="#EDF5F8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="relative bg-[#0d2138] overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img src={footerBg} alt="" className="w-full h-full object-cover object-bottom opacity-10" />
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-6 lg:px-16 py-16 pb-10">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 pb-12 border-b border-[rgba(255,255,255,0.16)]">
          {/* Left - Newsletter */}
          <div className="lg:max-w-[460px]">
            <h3
              className="text-[24px] lg:text-[28px] font-medium text-white leading-[36px] mb-6"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              From concept sketches to final execution.
            </h3>
            <p
              className="text-[15px] text-white opacity-80 mb-4"
              style={{ fontFamily: "Montserrat, sans-serif" }}
            >
              Subscribe our news letter
            </p>
            <div className="relative bg-[#f5f7fa] rounded-full flex items-center h-[52px]">
              <input
                type="email"
                placeholder="Enter your email address"
                className="flex-1 bg-transparent px-6 text-[15px] text-[#717784] outline-none"
                style={{ fontFamily: "Montserrat, sans-serif" }}
              />
              <button
                className="absolute right-1 h-[44px] px-6 rounded-full text-[15px] font-medium text-white"
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  background: "linear-gradient(to bottom, #005ea4, #006fc2)",
                  border: "1px solid #0088ff",
                }}
              >
                Subscribe
              </button>
            </div>
          </div>

          {/* Right - Navigation + Contact */}
          <div className="flex flex-col sm:flex-row gap-12 sm:gap-16 flex-1 lg:justify-end">
            {/* Navigation */}
            <div>
              <p
                className="text-[17px] font-medium text-white border-b border-[rgba(255,255,255,0.2)] pb-2 mb-5"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Navigation
              </p>
              <ul className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-[15px] text-white opacity-80 hover:opacity-100 transition-opacity"
                      style={{ fontFamily: "Montserrat, sans-serif" }}
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <p
                className="text-[17px] font-medium text-white border-b border-[rgba(255,255,255,0.2)] pb-2 mb-5"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Visit Our Office
              </p>
              <div className="flex flex-col gap-5">
                <div className="flex gap-3 opacity-80">
                  <div className="mt-1 flex-shrink-0">
                    <LocationIcon />
                  </div>
                  <p
                    className="text-[15px] text-white leading-[24px]"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    4517 Washington Ave. Manchester,
                    <br />
                    Kentucky 39495
                  </p>
                </div>
                <div className="flex items-center gap-3 opacity-80">
                  <MailIcon />
                  <span
                    className="text-[15px] text-white"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    contact@ulrichpropiedades.com
                  </span>
                </div>
                <div className="flex items-center gap-3 opacity-80">
                  <PhoneIcon />
                  <span
                    className="text-[15px] text-white"
                    style={{ fontFamily: "Montserrat, sans-serif" }}
                  >
                    (239) 555-0108
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6">
          <p
            className="text-[15px] text-white opacity-70"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Ulrich Propiedades © 2026. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
