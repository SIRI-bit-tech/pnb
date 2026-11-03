"use client";

import React, { useState } from "react";
import FormInput from "./FormInput";
import CountrySelector from "./CountrySelector";
import { useZipLookup } from "@/hooks/useZipLookup";
import { CountryCode, AuthFormType } from "@/types";

interface AuthFormProps {
  type: AuthFormType;
  onSubmit: (formData: any) => Promise<void>;
  isLoading: boolean;
  serverError?: string;
}

export default function AuthForm({ type, onSubmit, isLoading, serverError }: AuthFormProps) {
  // Common states
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  // Register states
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [zip, setZip] = useState("");
  const [dob, setDob] = useState("");
  const [sex, setSex] = useState("");
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({});

  // Trigger Zip Code Lookup
  const { isValidating } = useZipLookup(zip, country, (resolvedCity, resolvedState) => {
    setCity(resolvedCity);
    setState(resolvedState);
    setLocalErrors((prev) => {
      const copy = { ...prev };
      delete copy.zip;
      return copy;
    });
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (type === "register") {
      if (password !== confirmPassword) {
        errors.confirmPassword = "Passwords do not match";
      }
      if (!city || !state) {
        errors.zip = "Invalid or unresolved postal code";
      }
      if (Object.keys(errors).length > 0) {
        setLocalErrors(errors);
        return;
      }
    }

    setLocalErrors({});
    await onSubmit({
      username,
      password,
      ...(type === "register" && {
        full_name: fullName,
        email,
        phone_number: phone,
        country,
        state,
        city,
        zip_code: zip,
        dob,
        sex,
      }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 w-full">
      {serverError && (
        <div className="rounded-2xl border border-error bg-error/10 p-4 text-xs text-error font-medium">
          {serverError}
        </div>
      )}

      {type === "register" && (
        <>
          <FormInput label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          <FormInput label="Email Address" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <FormInput label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          
          <div className="grid grid-cols-2 gap-4">
            <FormInput 
              label="Date of Birth" 
              type="date" 
              value={dob} 
              onChange={(e) => setDob(e.target.value)} 
              required 
            />
            <div className="flex flex-col gap-1 w-full relative">
              <div className="relative w-full rounded-2xl border border-zinc-200 bg-zinc-50/50 hover:border-zinc-300">
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full px-4 pt-6 pb-2 bg-transparent text-sm text-zinc-900 focus:outline-none appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled hidden>Select Sex</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <label className="absolute left-4 top-1.5 text-[10px] uppercase font-bold tracking-wider text-zinc-400 pointer-events-none">
                  Sex / Gender
                </label>
              </div>
            </div>
          </div>
        </>
      )}

      <FormInput label="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />

      <FormInput
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        showPasswordStrength={type === "register"}
        required
      />

      {type === "register" && (
        <>
          <FormInput
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={localErrors.confirmPassword}
            required
          />
          <CountrySelector value={country} onChange={(code) => { setCountry(code); setCity(""); setState(""); setZip(""); }} />
          <FormInput label="Zip / Postal Code" value={zip} onChange={(e) => setZip(e.target.value)} error={localErrors.zip} required />
          {(city || isValidating) && (
            <div className="grid grid-cols-2 gap-4">
              <FormInput label="City" value={isValidating ? "Resolving..." : city} readOnly required />
              <FormInput label="State / Region" value={isValidating ? "..." : state} readOnly required />
            </div>
          )}
        </>
      )}

      <button
        type="submit"
        disabled={isLoading || isValidating}
        className="w-full mt-2 bg-[#1faa6e] hover:bg-[#18935f] text-white font-semibold py-3.5 rounded-2xl transition-colors duration-300 disabled:opacity-50"
      >
        {isLoading ? "Processing..." : type === "register" ? "Create Account" : "Sign In"}
      </button>
    </form>
  );
}
