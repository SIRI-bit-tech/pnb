"use client";

import React from "react";
import FormInput from "@/components/FormInput";
import { ProfileFormProps } from "./types";
import { Lock, ShieldCheck, Calendar } from "lucide-react";

export default function ProfileForm({
  profile,
  setProfile,
  submitting,
  onSubmit,
  onAvatarChange
}: ProfileFormProps) {
  // Format Date Joined / Member Since
  const formattedMemberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "Verified Account";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      {/* Avatar & Membership Overview */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80">
        <div className="flex items-center gap-4">
          <img 
            src={profile.profile_image_url || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"} 
            alt="Avatar" 
            className="w-14 h-14 rounded-full object-cover bg-white border border-zinc-200 shadow-sm" 
          />
          <div className="flex flex-col">
            <span className="text-sm font-bold text-zinc-900">{profile.full_name}</span>
            <span className="text-xs text-zinc-500">@{profile.username}</span>
            <label className="text-[11px] font-semibold text-[#1faa6e] hover:text-[#18935f] cursor-pointer mt-1">
              Upload New Photo
              <input type="file" onChange={onAvatarChange} className="hidden" accept="image/*" />
            </label>
          </div>
        </div>

        {/* Date Joined Badge */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white border border-zinc-200/90 shadow-xs">
          <Calendar className="w-4 h-4 text-[#1faa6e]" />
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Member Since</span>
            <span className="text-xs font-semibold text-zinc-800">{formattedMemberSince}</span>
          </div>
        </div>
      </div>

      {/* Editable Fields: Full Name & Username */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Editable Account Information
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormInput 
            label="Full Name" 
            value={profile.full_name || ""} 
            onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} 
            required 
          />
          <FormInput 
            label="Username" 
            value={profile.username || ""} 
            onChange={(e) => setProfile({ ...profile, username: e.target.value })} 
            required 
          />
        </div>
      </div>

      {/* Locked KYC Fields Notice */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>Verified KYC Identity, Contact & Location</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
              Locked
            </span>
          </h4>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900 leading-relaxed">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            Under federal banking KYC (Know Your Customer) regulations, your verified Email Address, Phone Number, Date of Birth, Gender, and Residential Location are locked and cannot be changed directly. To request an update, please contact bank compliance or visit your local branch.
          </p>
        </div>

        {/* Contact Details (Locked) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <FormInput 
              label="Email Address" 
              type="email" 
              value={profile.email || "Not Provided"} 
              disabled
              readOnly
              className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-5" />
          </div>

          <div className="relative">
            <FormInput 
              label="Phone Number" 
              type="tel" 
              value={profile.phone_number || "Not Provided"} 
              disabled
              readOnly
              className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-5" />
          </div>
        </div>

        {/* Date of Birth & Sex (Locked) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <FormInput 
              label="Date of Birth" 
              type="text" 
              value={profile.dob || "Not Provided"} 
              disabled
              readOnly
              className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-5" />
          </div>

          <div className="relative">
            <FormInput 
              label="Gender / Sex" 
              type="text" 
              value={profile.sex || "Not Specified"} 
              disabled
              readOnly
              className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-5" />
          </div>
        </div>

        {/* Address Info (Locked) */}
        <div className="space-y-3 pt-1">
          <div className="relative">
            <FormInput 
              label="Country" 
              type="text" 
              value={profile.country === "US" ? "United States (USD)" : profile.country || "United States"} 
              disabled
              readOnly
              className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
            />
            <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-4 top-5" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <FormInput 
                label="State / Province" 
                value={profile.state || ""} 
                disabled
                readOnly
                className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-5" />
            </div>

            <div className="relative">
              <FormInput 
                label="City" 
                value={profile.city || ""} 
                disabled
                readOnly
                className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-5" />
            </div>

            <div className="relative">
              <FormInput 
                label="ZIP / Postal Code" 
                value={profile.zip_code || ""} 
                disabled
                readOnly
                className="bg-zinc-100/70 text-zinc-500 cursor-not-allowed border-zinc-200"
              />
              <Lock className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button for Name and Username */}
      <button 
        type="submit" 
        disabled={submitting} 
        className="w-full py-3.5 rounded-2xl bg-[#1faa6e] hover:bg-[#18935f] text-white font-bold text-xs transition-all shadow-sm disabled:opacity-50 mt-2 cursor-pointer flex items-center justify-center gap-2"
      >
        {submitting ? (
          <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          "Save Profile Changes"
        )}
      </button>
    </form>
  );
}
