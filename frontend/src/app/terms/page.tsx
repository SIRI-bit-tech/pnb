import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Terms() {
  return (
    <div className="relative w-full min-h-screen bg-background">
      <Navbar />

      <main className="w-full max-w-4xl mx-auto px-6 pt-32 pb-24 md:pt-48 flex flex-col gap-12">
        {/* Intro */}
        <div className="flex flex-col gap-4 border-b border-white/5 pb-8">
          <span className="text-xs font-semibold text-primary-light uppercase tracking-widest">Legal Enclosure</span>
          <h1 className="text-4xl sm:text-5xl font-heading font-bold text-white tracking-tight">
            Terms of Service
          </h1>
          <p className="text-sm text-primary-muted">
            Last Updated: July 12, 2026
          </p>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-8 text-sm text-primary-muted leading-relaxed">
          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">1. Scope & Relationship</h2>
            <p>
              Prescott National Bank is a fully regulated financial institution. All banking services, check deposit settlements, and debit card issuances are directly managed and insured under FDIC guidelines. By opening an account, you authorize Prescott National Bank to execute financial transactions on your behalf.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">2. Security & Credentials</h2>
            <p>
              You are solely responsible for keeping your credentials confidential. Prescott National Bank hashes passwords using the Argon2id protocol (including unique salt and server-side pepper keys) to guarantee cryptographic integrity. Authentication is fortified with secure email multi-factor OTP verification. If you suspect unauthorized wallet entry, notify support immediately.
            </p>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">3. Express Transfer & Wire Limits</h2>
            <p>
              All deposits, wire settlements, and ACH transfers must comply with banking regulatory directives.
            </p>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              <li>Express transfers are settled instantly to verified accounts.</li>
              <li>Wire routing lookups are validated in real-time. Transfers are irreversible once initiated.</li>
              <li>Deposits are held in a pending queue until checked and confirmed by compliance reviewers.</li>
            </ul>
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-xl font-heading font-semibold text-white">4. Acceptable Use Guidelines</h2>
            <p>
              Users are forbidden from manipulating transaction balances or executing race conditions (e.g. initiating concurrent transfer requests to bypass insufficient balance limitations). All accounts are monitored via transaction tracking logs. Violations will trigger immediate account suspension and compliance audits.
            </p>
          </section>

          <section className="flex flex-col gap-4 border-t border-white/5 pt-8">
            <p>
              For further questions regarding our compliance, please review our{" "}
              <Link href="/privacy" className="text-primary-light hover:underline">
                Privacy Policy
              </Link>{" "}
              or contact our support desk.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
