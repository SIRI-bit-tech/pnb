import React from "react";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";
import BottomNav from "@/components/dashboard/BottomNav";

export const metadata = {
  title: "Dashboard — Prescott National Bank",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-zinc-900">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Page content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile glassmorphic bottom nav */}
      <BottomNav />
    </div>
  );
}
