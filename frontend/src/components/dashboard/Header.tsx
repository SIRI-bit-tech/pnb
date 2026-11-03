"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, LogOut, Settings } from "lucide-react";
import type { UserProfile } from "@/types";

import { getApiBase } from "@/lib/api";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 21) return "Good Evening";
  return "Good Night";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHome = pathname === "/dashboard";
  const firstName = profile?.full_name?.split(" ")[0] ?? null;

  useEffect(() => {
    const fetchProfileAndNotifications = async () => {
      const token = localStorage.getItem("session_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const apiBase = getApiBase();
      try {
        // Fetch profile
        const profileRes = await fetch(`${apiBase}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setProfile(profileData);
        } else if (profileRes.status === 401) {
          // Only remove token and redirect if explicitly 401 Unauthorized
          localStorage.removeItem("session_token");
          router.push("/login");
          return;
        }

        // Fetch unread notifications count
        const notifyRes = await fetch(`${apiBase}/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (notifyRes.ok) {
          const notifyData = await notifyRes.json();
          setUnreadCount(notifyData.unread_count || 0);
        }
      } catch (err) {
        console.error("Error fetching header data:", err);
      }
    };

    fetchProfileAndNotifications();
  }, [router]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("session_token");
    router.push("/login");
  };

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "PT";

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-4 lg:px-8 border-b border-white/[0.05] bg-[#101828] backdrop-blur-2xl">
      <div className="flex flex-col">
        {isHome && firstName ? (
          <>
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
              {getGreeting()},
            </span>
            <h1 className="font-heading font-semibold text-white text-base lg:text-lg tracking-tight leading-snug">
              {firstName}
            </h1>
          </>
        ) : (
          <h1 className="font-heading font-semibold text-white text-base lg:text-lg tracking-tight">
            {firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
          </h1>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          href="/dashboard/notifications"
          className="relative p-2.5 rounded-xl text-primary-muted hover:text-white hover:bg-white/[0.06] transition-all duration-200"
          aria-label="Notifications"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-error border-2 border-background animate-pulse" />
          )}
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-white/[0.06] transition-all duration-200 focus:outline-none"
            aria-expanded={dropdownOpen}
          >
            {profile?.profile_image_url ? (
              <img
                src={profile.profile_image_url}
                alt={profile.full_name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/40 to-primary-light/30 flex items-center justify-center text-[11px] font-bold text-white uppercase">
                {initials}
              </div>
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 text-primary-muted transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-[calc(100%+8px)] w-48 rounded-2xl border border-white/10 bg-[#131f30] shadow-2xl backdrop-blur-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-white/[0.06]">
                <p className="text-xs font-semibold text-white truncate">
                  {profile?.full_name || "My Account"}
                </p>
                <p className="text-[10px] text-primary-muted truncate">
                  @{profile?.username || "personal"}
                </p>
              </div>
              <Link
                href="/dashboard/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-primary-muted hover:text-white hover:bg-white/[0.05] transition-colors"
              >
                <Settings className="w-3.5 h-3.5" /> Settings
              </Link>
              <div className="border-t border-white/[0.06]">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-error hover:bg-error/10 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
