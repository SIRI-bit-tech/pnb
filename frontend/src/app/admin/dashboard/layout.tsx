import React from "react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export const metadata = {
  title: "Admin Dashboard — Prescott National Bank",
};

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f9f9ff] text-zinc-900">
      {/* Desktop sidebar */}
      <AdminSidebar />

      {/* Page content */}
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <AdminHeader />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8 pb-28 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
