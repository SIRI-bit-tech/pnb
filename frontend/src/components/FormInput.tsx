"use client";

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  showPasswordStrength?: boolean;
}

export default function FormInput({
  label,
  error,
  showPasswordStrength = false,
  type = "text",
  className = "",
  value,
  ...props
}: FormInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const valString = String(value || "");
  const isPasswordField = type === "password";
  const computedType = isPasswordField && showPassword ? "text" : type;

  // Password strength visual indicators
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: "", color: "bg-transparent" };
    let score = 0;
    if (pwd.length >= 8) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[0-9]/.test(pwd)) score += 1;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1;

    if (score <= 2) return { score, label: "Weak", color: "bg-error" };
    if (score <= 4) return { score, label: "Medium", color: "bg-warning" };
    return { score, label: "Strong", color: "bg-success" };
  };

  const strength = showPasswordStrength ? getPasswordStrength(valString) : null;

  return (
    <div className="flex flex-col gap-1 w-full relative">
      {/* Floating Label Container */}
      <div
        className={`relative w-full rounded-2xl border transition-all duration-300 bg-zinc-50/50 ${
          error
            ? "border-red-500/80"
            : isFocused
            ? "border-primary ring-1 ring-primary"
            : "border-zinc-200 hover:border-zinc-300"
        } ${className}`}
      >
        <input
          type={computedType}
          value={value}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`w-full px-4 ${isPasswordField ? "pr-11" : ""} pt-6 pb-2 bg-transparent text-sm text-zinc-900 focus:outline-none placeholder-transparent`}
          placeholder={label}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100/70 transition-colors cursor-pointer"
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
        <label
          className={`absolute left-4 pointer-events-none transition-all duration-300 font-sans text-zinc-400 ${
            isFocused || valString
              ? "top-1.5 text-[10px] uppercase font-bold tracking-wider"
              : "top-4 text-sm"
          }`}
        >
          {label}
        </label>
      </div>

      {/* Error Message */}
      {error && <span className="text-xs text-red-500 font-semibold px-1">{error}</span>}

      {/* Password Strength Indicator */}
      {showPasswordStrength && valString && strength && (
        <div className="flex flex-col gap-1.5 px-1 mt-1">
          <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            <span>Password Strength</span>
            <span className={error ? "text-red-500" : strength.score <= 2 ? "text-red-500" : strength.score <= 4 ? "text-amber-500" : "text-emerald-500"}>
              {strength.label}
            </span>
          </div>
          <div className="flex gap-1 h-1 w-full rounded-full bg-zinc-100 overflow-hidden">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 h-full rounded-full transition-all duration-300 ${
                  i < strength.score ? strength.color : "bg-transparent"
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
