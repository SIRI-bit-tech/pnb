"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const navLinks = [
    { name: "Personal", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Terms", href: "/terms" },
    { name: "Privacy", href: "/privacy" },
  ];

  return (
    <header className="fixed top-0 inset-x-0 z-40 flex items-center justify-between px-6 py-4 md:px-12 pointer-events-none">
      {/* Floating glass navigation enclosure */}
      <div className="flex items-center justify-between w-full max-w-7xl mx-auto px-6 py-3 rounded-full backdrop-blur-lg bg-white/70 border border-zinc-200/80 shadow-sm pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
        
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2 group shrink-0">
          <Image
            src="/Prescott-National-Bank-logo.png"
            alt="Prescott National Bank"
            width={96}
            height={96}
            className="h-11 md:h-12 -my-1 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
            priority
          />
        </Link>

        {/* Center: Desktop Links */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors duration-300"
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Right: Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-950 transition-colors duration-300 px-4 py-2"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="group flex items-center gap-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark transition-colors duration-300 px-5 py-2.5 rounded-full"
          >
            Get Started
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 text-white" />
            </div>
          </Link>
        </div>

        {/* Hamburger Menu Toggle (Mobile) */}
        <button
          onClick={toggleMenu}
          className="flex flex-col justify-center items-center w-8 h-8 rounded-full bg-zinc-100 border border-zinc-200 md:hidden focus:outline-none transition-colors duration-300 hover:bg-zinc-200"
          aria-label="Toggle navigation menu"
        >
          <div className="relative w-4 h-4 flex flex-col justify-between">
            <span
              className={`w-4 h-[2px] bg-zinc-800 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOpen ? "translate-y-[7px] rotate-45" : ""
              }`}
            />
            <span
              className={`w-4 h-[2px] bg-zinc-800 rounded-full transition-all duration-300 ${
                isOpen ? "opacity-0 scale-50" : ""
              }`}
            />
            <span
              className={`w-4 h-[2px] bg-zinc-800 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${
                isOpen ? "-translate-y-[7px] -rotate-45" : ""
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-x-0 top-0 h-[100dvh] bg-white/95 backdrop-blur-2xl flex flex-col justify-center px-8 transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] z-[-1] pointer-events-auto ${
          isOpen ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-full"
        }`}
      >
        <div className="flex flex-col gap-6 text-left max-w-md mx-auto w-full">
          {navLinks.map((link, index) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              style={{ transitionDelay: `${index * 50}ms` }}
              className={`text-3xl font-heading font-semibold text-zinc-500 hover:text-zinc-950 transition-all duration-500 ${
                isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <div
            style={{ transitionDelay: `${navLinks.length * 50}ms` }}
            className={`flex flex-col gap-4 mt-8 border-t border-zinc-200 pt-8 transition-all duration-500 ${
              isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <Link
              href="/login"
              onClick={() => setIsOpen(false)}
              className="text-lg font-semibold text-center text-zinc-900 border border-zinc-200 hover:bg-zinc-50 transition-colors duration-300 py-3 rounded-full"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setIsOpen(false)}
              className="text-lg font-semibold text-center text-white bg-primary hover:bg-primary-dark transition-colors duration-300 py-3 rounded-full"
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
