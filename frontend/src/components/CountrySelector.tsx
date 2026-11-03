"use client";

import React, { useState } from "react";
import ReactCountryFlag from "react-country-flag";
import { ChevronDown } from "lucide-react";
import { CountryCode } from "@/types";

interface CountrySelectorProps {
  value: CountryCode;
  onChange: (value: CountryCode) => void;
  error?: string;
}

export default function CountrySelector({ value, onChange, error }: CountrySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const countries: { code: CountryCode; label: string; flagCode: string }[] = [
    { code: "US", label: "United States", flagCode: "US" },
    { code: "CA", label: "Canada", flagCode: "CA" },
    { code: "UK", label: "United Kingdom", flagCode: "GB" },
  ];

  const selected = countries.find((c) => c.code === value) || countries[0];

  const handleSelect = (code: CountryCode) => {
    onChange(code);
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-1 w-full relative">
      <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400 px-1">
        Country / Jurisdiction
      </span>
      
      {/* Dropdown Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border bg-zinc-50/50 text-sm text-zinc-900 focus:outline-none transition-all duration-300 ${
          error ? "border-red-500/80" : "border-zinc-200 hover:border-zinc-300"
        }`}
      >
        <div className="flex items-center gap-3">
          <ReactCountryFlag
            countryCode={selected.flagCode}
            svg
            style={{ width: "20px", height: "15px" }}
          />
          <span>{selected.label}</span>
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute top-[75px] left-0 w-full rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden z-50">
          {countries.map((c) => (
            <button
              key={c.code}
              type="button"
              onClick={() => handleSelect(c.code)}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-zinc-700 hover:text-zinc-950 hover:bg-zinc-50 transition-colors text-left"
            >
              <ReactCountryFlag
                countryCode={c.flagCode}
                svg
                style={{ width: "20px", height: "15px" }}
              />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {error && <span className="text-xs text-red-500 font-semibold px-1">{error}</span>}
    </div>
  );
}
