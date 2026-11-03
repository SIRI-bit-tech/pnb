import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Privacy() {
  return (
    <div className="relative w-full min-h-screen bg-background">
      <Navbar />

      <main className="w-full max-w-4xl mx-auto px-6 pt-32 pb-24 md:pt-48 flex flex-col gap-12">
        {/* Intro */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-8">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest">Legal Enclosure</span>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white tracking-tight">
            Privacy Policy
          </h1>
          <p className="text-sm text-primary-muted">
            Last Updated: July 12, 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 text-sm text-primary-muted leading-relaxed">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">1. Information Collection</h2>
            <p>
              We gather details to verify identities and execute compliance audits under regional banking directives. Collected information includes name, email, username, and address coordinates (city, state, zip). Address profiles are validated upon submission against US, Canada, and UK regional formats.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">2. Cryptographic Storage & Encryption</h2>
            <p>
              Your sensitive banking details, including virtual card numbers and CVV codes, are encrypted at rest using **AES-256-GCM** algorithms. Decryption is isolated strictly to backend operational contexts. Check documents submitted for deposit are transferred securely over TLS 1.3 and stored in secured cloud containers.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">3. Third-Party Disclosures</h2>
            <p>
              We do not sell user data to advertising third parties. Your coordinates, transaction totals, and routing details are shared strictly with partner banks to settle transactions, resolve wires, and verify deposit check legitimacy.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">4. Your Compliance Choices</h2>
            <p>
              You can adjust notification preferences (transfers, deposits, card updates) inside your account settings. If you choose to deactivate your account, we retain essential transaction logs as required by banking compliance regulations.
            </p>
          </section>

          <section className="flex flex-col gap-4 border-t border-white/5 pt-8">
            <p>
              For further queries, read our{" "}
              <Link href="/terms" className="text-primary-light hover:underline">
                Terms of Service
              </Link>{" "}
              or get in touch with our security compliance officer.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
