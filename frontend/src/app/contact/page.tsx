"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { 
  Mail, 
  MapPin, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  Headphones,
  Sparkles,
  Building,
  HelpCircle,
  ChevronDown
} from "lucide-react";
import { getApiBase } from "@/lib/api";

const CATEGORIES = [
  "Account & Online Banking Support",
  "Domestic & International Wires",
  "Commercial & Institutional Services",
  "Security, PIN & Multi-Factor Access",
  "Loan & Credit Facility Inquiries",
  "General Inquiry"
];

const FAQS = [
  {
    q: "What are the wire transfer cutoff times?",
    a: "Outbound same-day domestic Fedwire transfers submitted before 3:30 PM PST are processed and settled on the same business day. ACH batch transfers settle within standard NACHA windows."
  },
  {
    q: "How can I freeze my debit card immediately in an emergency?",
    a: "You can toggle instant freeze on any physical or virtual card 24/7 directly from your dashboard under the 'Cards' tab. Alternatively, submit an emergency hold inquiry directly through our client support portal."
  },
  {
    q: "Where do I find my account and routing numbers?",
    a: "Your 9-digit ABA routing transit number (121175254) and unique checking account number are visible securely within your authenticated online dashboard under 'Account Details'."
  },
  {
    q: "Can I visit the San Francisco branch in person?",
    a: "Yes. Our flagship branch and executive client offices are located at 345 California Street in San Francisco's Financial District. Appointments for private banking and institutional treasury can be booked online or via email inquiry."
  }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: CATEGORIES[0],
    subject: "",
    message: ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [referenceId, setReferenceId] = useState("");
  const [assignedRecipient, setAssignedRecipient] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all required fields (Name, Email, Message).");
      return;
    }

    setIsSubmitting(true);

    try {
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/contact/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Failed to submit inquiry. Please try again.");
      }

      setSubmitSuccess(true);
      setReferenceId(data.reference_id || "PNB-CNT-SUBMITTED");
      setAssignedRecipient(data.assigned_email || "support@prescottnational.com");
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred while transmitting your inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      category: CATEGORIES[0],
      subject: "",
      message: ""
    });
    setSubmitSuccess(false);
    setReferenceId("");
    setErrorMessage("");
  };

  return (
    <div className="bg-[#fafafa] text-[#151c27] font-sans min-h-screen flex flex-col antialiased selection:bg-[#1faa6e]/20 selection:text-[#006d43]">
      <Navbar />

      <main className="flex-grow flex flex-col pt-24 pb-20">
        
        {/* 1. Header / Hero */}
        <section className="relative pt-12 pb-16 px-6 md:px-12 max-w-7xl mx-auto w-full">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-xs font-semibold text-emerald-800 tracking-wide uppercase mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#1faa6e] animate-pulse"></span>
              Client Services & Institutional Advisory
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-heading text-zinc-950 tracking-tight leading-[1.1] mb-6">
              How can our team <span className="text-[#1faa6e]">assist you</span> today?
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-2xl">
              Connect directly with our dedicated banking officers. Whether you need assistance with account operations, commercial wire settlements, or security, we are standing by to help.
            </p>
          </div>
        </section>

        {/* 2. Direct Channels Bento Grid */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Card 1: Live Support */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#1faa6e] flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-zinc-900 text-base mb-1">Electronic Support</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Direct dispatch to client advisory and operations desks.
                </p>
              </div>
              <div>
                <a 
                  href="mailto:support@prescottnational.com" 
                  className="font-mono text-sm font-semibold text-[#1faa6e] hover:underline block break-all"
                >
                  support@prescottnational.com
                </a>
                <span className="text-[11px] text-zinc-400 mt-1 block">Response within 4 hours</span>
              </div>
            </div>

            {/* Card 2: Priority Advisory */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Headphones className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-zinc-900 text-base mb-1">Priority Advisory</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Dedicated relationship officers and wire clearance support.
                </p>
              </div>
              <div>
                <div className="font-heading text-sm font-semibold text-zinc-900">
                  Direct Client Services
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">Mon–Fri: 7:00 AM – 7:00 PM PST</span>
              </div>
            </div>

            {/* Card 3: Branch HQ */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-zinc-900 text-base mb-1">Financial District HQ</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  San Francisco executive branch and private client suites.
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-zinc-800 leading-snug">
                  California Street<br />
                  Financial District, San Francisco, CA
                </p>
                <span className="text-[11px] text-zinc-400 mt-1 block">Mon–Fri: 7:00 AM – 7:00 PM PST</span>
              </div>
            </div>

            {/* Card 4: Clearing Operations */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/80 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="font-heading font-semibold text-zinc-900 text-base mb-1">Institutional Clearing</h3>
                <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                  Direct FedACH and Fedwire participant for institutional accounts.
                </p>
              </div>
              <div>
                <div className="font-heading text-sm font-semibold text-zinc-900">
                  Direct Fedwire Clearing
                </div>
                <span className="text-[11px] text-zinc-400 mt-1 block">Sub-minute settlement network</span>
              </div>
            </div>

          </div>
        </section>

        {/* 3. Interactive Contact Form & Live Support Console */}
        <section className="px-6 md:px-12 max-w-7xl mx-auto w-full mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* Left: Contact Form Enclosure (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 border border-zinc-200/80 shadow-sm">
              
              {!submitSuccess ? (
                <>
                  <div className="mb-8">
                    <h2 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-950 tracking-tight mb-2">
                      Send a Direct Message
                    </h2>
                    <p className="text-sm text-zinc-500">
                      Fill out the form below. Inquiries are automatically routed to the designated banking officer and confirmed via receipt email.
                    </p>
                  </div>

                  {errorMessage && (
                    <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                    
                    {/* Name & Email Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Alexander Vance"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1faa6e]/30 focus:border-[#1faa6e] transition-all"
                        />
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="name@company.com"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1faa6e]/30 focus:border-[#1faa6e] transition-all"
                        />
                      </div>
                    </div>

                    {/* Department & Subject Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                          Inquiry Department <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1faa6e]/30 focus:border-[#1faa6e] transition-all appearance-none cursor-pointer"
                        >
                          {CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                          Subject Line
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          placeholder="Brief summary of your inquiry"
                          className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1faa6e]/30 focus:border-[#1faa6e] transition-all"
                        />
                      </div>
                    </div>

                    {/* Message Body */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
                        Inquiry Details <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Please provide relevant context, references, or specific questions so we can assist you promptly..."
                        className="w-full px-4 py-3 rounded-xl border border-zinc-200 bg-zinc-50/50 text-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#1faa6e]/30 focus:border-[#1faa6e] transition-all resize-none"
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <p className="text-xs text-zinc-400">
                        Encrypted transmission with TLS 1.3 • Regulated by the OCC & FDIC
                      </p>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-[#1faa6e] hover:bg-[#006d43] text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Transmitting...
                          </>
                        ) : (
                          <>
                            Transmit Message
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>

                  </form>
                </>
              ) : (
                /* Success Confirmation State */
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-[#1faa6e] flex items-center justify-center mb-6 shadow-sm border border-emerald-200">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>

                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full mb-3">
                    Dispatched Successfully
                  </span>

                  <h2 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-950 mb-3">
                    Thank You, {formData.name}
                  </h2>

                  <p className="text-sm text-zinc-600 max-w-md mb-6 leading-relaxed">
                    Your message has been assigned tracking reference <strong className="font-mono text-zinc-900">{referenceId}</strong> and delivered to our assigned support desk at <strong className="text-zinc-900">{assignedRecipient}</strong>.
                  </p>

                  <div className="w-full max-w-md bg-zinc-50 rounded-2xl p-6 border border-zinc-200 text-left mb-8">
                    <div className="flex justify-between items-center pb-3 border-b border-zinc-200/80 text-xs">
                      <span className="text-zinc-500">Tracking Reference</span>
                      <span className="font-mono font-bold text-[#1faa6e]">{referenceId}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-200/80 text-xs">
                      <span className="text-zinc-500">Department</span>
                      <span className="font-medium text-zinc-800">{formData.category}</span>
                    </div>
                    <div className="flex justify-between items-center py-3 border-b border-zinc-200/80 text-xs">
                      <span className="text-zinc-500">Confirmation Sent To</span>
                      <span className="font-medium text-zinc-800">{formData.email}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 text-xs">
                      <span className="text-zinc-500">Expected Resolution</span>
                      <span className="font-medium text-emerald-700">Within 4 business hours</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-2.5 rounded-xl border border-zinc-200 hover:border-zinc-300 text-zinc-700 font-semibold text-xs transition-colors bg-white shadow-sm"
                  >
                    Submit Another Inquiry
                  </button>
                </div>
              )}

            </div>

            {/* Right: Operational Status & Branch Highlights (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              
              {/* Box 1: Institutional Commitment */}
              <div className="bg-[#121929] text-white rounded-3xl p-8 border border-zinc-800 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Building className="w-32 h-32" />
                </div>

                <div className="relative z-10 flex flex-col gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#1faa6e]">
                    <ShieldCheck className="w-5 h-5" />
                  </div>

                  <h3 className="text-xl font-bold font-heading">
                    Priority Banking Support Standards
                  </h3>

                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Prescott National Bank client inquiries are managed directly by licensed financial operations professionals located at our California headquarters. We do not use third-party offshore support pools.
                  </p>

                  <div className="flex flex-col gap-3 pt-4 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-[#1faa6e]" />
                      <span>Dedicated relationship managers for commercial clients</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-[#1faa6e]" />
                      <span>Direct Fedwire and SWIFT transaction investigation</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300">
                      <CheckCircle2 className="w-4 h-4 text-[#1faa6e]" />
                      <span>Guaranteed response time within 4 business hours</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Box 2: Operating Hours */}
              <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-800">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-heading font-semibold text-zinc-900 text-sm">Operating Desks</h4>
                    <span className="text-xs text-emerald-600 font-medium">All systems operational</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2 text-xs text-zinc-600">
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Monday – Friday</span>
                    <span className="font-semibold text-zinc-900">7:00 AM – 7:00 PM PST</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-zinc-100">
                    <span>Saturday Wire Desk</span>
                    <span className="font-semibold text-zinc-900">8:00 AM – 2:00 PM PST</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span>Emergency Card Hotline</span>
                    <span className="font-semibold text-[#1faa6e]">24/7/365 Available</span>
                  </div>
                </div>
              </div>

              {/* Box 3: Existing Client Quick-Link */}
              <div className="bg-emerald-50/60 rounded-3xl p-8 border border-emerald-200/70 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
                  <Sparkles className="w-4 h-4 text-[#1faa6e]" />
                  Already a Prescott National Bank client?
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed">
                  Log in to your authenticated dashboard to access live agent messaging with verified account telemetry and immediate transfer lookups.
                </p>
                <div className="pt-2">
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-900 hover:text-[#006d43] transition-colors"
                  >
                    Sign in to Client Portal
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* 4. Frequently Asked Questions */}
        <section className="px-6 md:px-12 max-w-4xl mx-auto w-full mb-12">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading text-zinc-950 mb-2">
              Frequently Asked Questions
            </h2>
            <p className="text-sm text-zinc-500">
              Immediate answers to common inquiries regarding account access, transfers, and security.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-zinc-200/80 overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-semibold text-sm text-zinc-900 hover:text-[#1faa6e] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#1faa6e]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-4 pt-1 text-xs sm:text-sm text-zinc-600 leading-relaxed border-t border-zinc-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
