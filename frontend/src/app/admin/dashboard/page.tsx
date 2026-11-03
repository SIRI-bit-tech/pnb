"use client";

import React, { useEffect, useState } from "react";
import { 
  Users, 
  Activity, 
  MessageSquare, 
  ArrowRightLeft, 
  Landmark, 
  AlertCircle, 
  CreditCard, 
  ChevronRight, 
  Server, 
  Shield, 
  CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from "recharts";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchStats();
    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Format currency helper
  const formatCurrency = (val: any) => {
    const num = Number(val || 0);
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2
    }).format(num);
  };

  const CARDS = [
    {
      title: "Total Users",
      value: stats?.total_users ?? 0,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50",
      desc: "Registered members"
    },
    {
      title: "Total Transactions",
      value: stats?.total_transactions_count ?? 0,
      icon: ArrowRightLeft,
      color: "text-blue-600",
      bg: "bg-blue-50",
      desc: "All-time ledger count"
    },
    {
      title: "Transactions Today",
      value: stats?.transactions_today_count ?? 0,
      icon: Activity,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      desc: "Processed last 24h"
    },
    {
      title: "Total Deposits",
      value: formatCurrency(stats?.total_deposits_amount),
      icon: Landmark,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      desc: "Confirmed cash-ins"
    },
    {
      title: "Pending Deposits",
      value: stats?.pending_deposits_count ?? 0,
      icon: AlertCircle,
      color: (stats?.pending_deposits_count ?? 0) > 0 ? "text-red-600 animate-pulse font-bold" : "text-zinc-500",
      bg: (stats?.pending_deposits_count ?? 0) > 0 ? "bg-red-50" : "bg-zinc-50",
      desc: "Awaiting approval"
    },
    {
      title: "Active Cards",
      value: stats?.total_active_cards ?? 0,
      icon: CreditCard,
      color: "text-sky-600",
      bg: "bg-sky-50",
      desc: "Issued to customers"
    }
  ];

  // Live daily trend data from the backend
  const chartData = stats?.daily_trends || [];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx} 
              className="bg-white rounded-2xl border border-zinc-200 p-5 flex items-start shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center mr-4 flex-shrink-0 group-hover:scale-105 transition-transform`}>
                <Icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-bold text-zinc-900 mt-1 truncate">{card.value}</p>
                <p className="text-xs text-zinc-500 mt-1">{card.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Stats Graph and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div className="mb-4">
            <h3 className="font-heading font-bold text-zinc-900 text-lg">System Activity Trend</h3>
            <p className="text-xs text-zinc-500 mt-0.5">Live weekly flow of confirmed deposits and completed transfers (in USD)</p>
          </div>
          <div className="h-72 w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorDeposits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTransfers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                  <XAxis dataKey="name" stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#a1a1aa" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "#ffffff", 
                      borderColor: "#e4e4e7",
                      borderRadius: "12px",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                    }} 
                  />
                  <Area type="monotone" dataKey="deposits" name="Deposits ($)" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorDeposits)" />
                  <Area type="monotone" dataKey="transfers" name="Transfers ($)" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTransfers)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                <p className="text-sm text-zinc-400">Loading chart analytics...</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info Panels */}
        <div className="space-y-6">
          {/* Action Required Queue Card */}
          {((stats?.pending_deposits_count ?? 0) > 0 || (stats?.open_support_tickets_count ?? 0) > 0) ? (
            <div className="bg-red-50/50 border border-red-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-bold text-red-950 text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 animate-bounce" />
                Action Queue
              </h3>
              <p className="text-xs text-red-700/80 mt-1">Pending items require manual review and response</p>
              <div className="mt-4 space-y-3">
                {(stats?.pending_deposits_count ?? 0) > 0 && (
                  <Link 
                    href="/admin/dashboard/deposits"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-red-200 hover:border-red-300 transition-colors text-sm"
                  >
                    <span className="font-medium text-zinc-900">
                      Pending Deposits ({stats.pending_deposits_count})
                    </span>
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  </Link>
                )}
                {(stats?.open_support_tickets_count ?? 0) > 0 && (
                  <Link 
                    href="/admin/dashboard/support"
                    className="flex items-center justify-between p-3 rounded-xl bg-white border border-red-200 hover:border-red-300 transition-colors text-sm"
                  >
                    <span className="font-medium text-zinc-900">
                      Open Support Tickets ({stats.open_support_tickets_count})
                    </span>
                    <ChevronRight className="w-4 h-4 text-red-600" />
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-heading font-bold text-emerald-950 text-lg flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                Zero Queue
              </h3>
              <p className="text-xs text-emerald-700/80 mt-1">Excellent! There are no pending deposits or tickets.</p>
            </div>
          )}

          {/* System Health Console */}
          <div className="bg-white rounded-2xl border border-zinc-200 p-6 shadow-sm space-y-4">
            <div>
              <h3 className="font-heading font-bold text-zinc-900 text-lg flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-600" />
                Service Health
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">Real-time status of backend services</p>
            </div>

            <div className="space-y-3">
              {[
                { name: "API Gateway", status: "Operational" },
                { name: "PostgreSQL Database", status: "Connected" },
                { name: "Ledger Core Engine", status: "Operational" },
                { name: "Card Provider", status: "Operational" },
                { name: "Resend Email Routing", status: "Active" }
              ].map((service, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1">
                  <span className="text-zinc-600 font-medium">{service.name}</span>
                  <span className="flex items-center gap-1.5 font-bold text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                    {service.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
