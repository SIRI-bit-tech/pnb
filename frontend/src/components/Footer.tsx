import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const linksCompany = [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "#" },
    { name: "Press Kit", href: "#" },
  ];

  const linksLegal = [
    { name: "Terms of Service", href: "/terms" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Compliance Review", href: "#" },
  ];

  const linksResources = [
    { name: "Developer APIs", href: "#" },
    { name: "Security Audits", href: "#" },
    { name: "Contact Support", href: "/contact" },
  ];

  return (
    <footer className="w-full bg-white border-t border-zinc-200 py-16 px-6 md:px-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col gap-16">
        
        {/* Top: Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Logo & Vibe */}
          <div className="col-span-2 md:col-span-1 flex flex-col gap-4">
            <Link href="/" className="inline-block">
              <Image
                src="/Prescott-National-Bank-logo.png"
                alt="Prescott National Bank"
                width={160}
                height={160}
                className="h-16 md:h-20 w-auto object-contain"
              />
            </Link>
            <p className="text-sm text-zinc-500 max-w-xs leading-6">
              Institutional-grade digital banking. Designed for speed, engineered for security.
            </p>
            <p className="text-xs text-zinc-400 leading-relaxed">
              California Street, Financial District<br />
              San Francisco, California
            </p>
          </div>

          {/* Company */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-zinc-800 uppercase tracking-widest">Company</span>
            <ul className="flex flex-col gap-2">
              {linksCompany.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-zinc-800 uppercase tracking-widest">Legal</span>
            <ul className="flex flex-col gap-2">
              {linksLegal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="flex flex-col gap-4">
            <span className="text-xs font-semibold text-zinc-800 uppercase tracking-widest">Resources</span>
            <ul className="flex flex-col gap-2">
              {linksResources.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors duration-300">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom: Fine Print & Copyright */}
        <div className="flex flex-col gap-8 border-t border-zinc-100 pt-8">
          <p className="text-xs text-zinc-400 leading-6 max-w-5xl">
            Prescott National Bank, N.A. is a Member FDIC and an Equal Housing Lender. All deposits are insured up to the maximum allowable limit of $250,000 per depositor. Investment services, securities, and stock brokerage accounts are offered through Prescott National Bank Brokerage Services, member FINRA/SIPC. Equal Opportunity Lender.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-zinc-400">
            <span>&copy; {currentYear} Prescott National Bank. All rights reserved.</span>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-zinc-900 transition-colors">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-zinc-900 transition-colors">Status: Operational</Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}
