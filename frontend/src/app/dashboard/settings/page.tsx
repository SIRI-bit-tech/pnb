"use client";

import React, { useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";
import PageShell from "@/components/dashboard/PageShell";
import SectionHeader from "@/components/dashboard/SectionHeader";

import ProfileForm from "./ProfileForm";
import SecurityForm from "./SecurityForm";
import NotificationsForm from "./NotificationsForm";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<"profile" | "security" | "notifications">("profile");
  const [profile, setProfile] = useState<any>(null);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Security Form States
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");

  const token = typeof window !== "undefined" ? localStorage.getItem("session_token") : null;
  const apiBase = getApiBase();

  const fetchData = async () => {
    try {
      const [pRes, nRes] = await Promise.all([
        fetch(`${apiBase}/settings/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiBase}/settings/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pRes.ok) setProfile(await pRes.json());
      if (nRes.ok) setNotifPrefs(await nRes.json());
    } catch {
      setStatusMsg({ type: "error", text: "Failed to fetch settings" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${apiBase}/settings/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          full_name: profile.full_name,
          username: profile.username,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data);
        setStatusMsg({ type: "success", text: "Profile updated successfully" });
      } else {
        setStatusMsg({ type: "error", text: data.detail || "Update failed" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    setSubmitting(true);
    setStatusMsg({ type: "", text: "" });
    const formData = new FormData();
    formData.append("file", e.target.files[0]);

    try {
      const res = await fetch(`${apiBase}/settings/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProfile((prev: any) => ({ ...prev, profile_image_url: data.profile_image_url }));
        setStatusMsg({ type: "success", text: "Avatar updated successfully" });
      } else {
        setStatusMsg({ type: "error", text: data.detail || "Avatar upload failed" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Upload network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg({ type: "", text: "" });
    try {
      const res = await fetch(`${apiBase}/settings/security`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          current_password: currentPw || undefined,
          new_password: newPw || undefined,
        }),
      });
      if (res.ok) {
        setStatusMsg({ type: "success", text: "Security credentials updated successfully" });
        setCurrentPw(""); setNewPw("");
      } else {
        const data = await res.json();
        setStatusMsg({ type: "error", text: data.detail || "Security update failed" });
      }
    } catch {
      setStatusMsg({ type: "error", text: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleNotifPref = async (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
    setNotifPrefs(updated);
    try {
      await fetch(`${apiBase}/settings/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
    } catch {
      setStatusMsg({ type: "error", text: "Failed to save alert toggle" });
    }
  };

  if (loading) return <div className="animate-pulse h-64 rounded-3xl bg-white border border-zinc-200" />;

  return (
    <PageShell maxWidth="sm">
      <SectionHeader title="Settings" subtitle="Manage your profile metadata, passcodes, and transaction alert controls." />
      
      <div className="flex rounded-2xl bg-zinc-100 p-1 border border-zinc-200/60 mb-6">
        {["profile", "security", "notifications"].map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as any); setStatusMsg({ type: "", text: "" }); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all capitalize cursor-pointer ${
              activeTab === tab ? "bg-white text-primary shadow-sm" : "text-zinc-400 hover:text-zinc-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold mb-6 border ${
          statusMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
        }`}>
          {statusMsg.text}
        </div>
      )}

      {activeTab === "profile" && profile && (
        <ProfileForm profile={profile} setProfile={setProfile} submitting={submitting} onSubmit={handleProfileSubmit} onAvatarChange={handleAvatarChange} />
      )}

      {activeTab === "security" && (
        <SecurityForm 
          currentPw={currentPw} 
          setCurrentPw={setCurrentPw} 
          newPw={newPw} 
          setNewPw={setNewPw} 
          submitting={submitting} 
          onSubmit={handleSecuritySubmit} 
          twoFactorEnabled={profile?.two_factor_enabled || false}
          onTwoFactorUpdate={(enabled) => setProfile((prev: any) => ({ ...prev, two_factor_enabled: enabled }))}
        />
      )}

      {activeTab === "notifications" && notifPrefs && (
        <NotificationsForm notifPrefs={notifPrefs} onToggle={toggleNotifPref} />
      )}
    </PageShell>
  );
}
