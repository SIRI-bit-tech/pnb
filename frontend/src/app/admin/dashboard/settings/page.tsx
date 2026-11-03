"use client";

import React, { useEffect, useState } from "react";
import { Upload } from "lucide-react";

export default function AdminSettingsPage() {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [cashAppTag, setCashAppTag] = useState("");
  const [payPalEmail, setPayPalEmail] = useState("");
  const [cashAppQRFile, setCashAppQRFile] = useState<File | null>(null);
  const [payPalQRFile, setPayPalQRFile] = useState<File | null>(null);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data);
        const ca = data.find((c: any) => c.key === "cashapp_tag");
        if (ca) setCashAppTag(ca.value);
        const pp = data.find((c: any) => c.key === "paypal_email");
        if (pp) setPayPalEmail(pp.value);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateTextConfig = async (key: string, value: string) => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/config/${key}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const uploadQR = async (key: string, file: File) => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"}/admin/config/upload-qr?key=${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    await updateTextConfig("cashapp_tag", cashAppTag);
    await updateTextConfig("paypal_email", payPalEmail);
    if (cashAppQRFile) await uploadQR("cashapp_qr_url", cashAppQRFile);
    if (payPalQRFile) await uploadQR("paypal_qr_url", payPalQRFile);
    await fetchConfigs();
  };

  const getConfigValue = (key: string) => {
    return configs.find((c: any) => c.key === key)?.value;
  };

  return (
    <div className="space-y-6 max-w-2xl">

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 space-y-8">
        
        {/* CashApp Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-2">CashApp Configuration</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">CashApp Tag</label>
            <input 
              type="text" 
              value={cashAppTag} 
              onChange={(e) => setCashAppTag(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="$yourtag"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">QR Code Image</label>
            <div className="flex items-center gap-4">
              {getConfigValue("cashapp_qr_url") && (
                <img src={getConfigValue("cashapp_qr_url")} alt="CashApp QR" className="w-16 h-16 rounded-lg object-cover border border-zinc-200" />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setCashAppQRFile(e.target.files?.[0] || null)}
                className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          </div>
        </div>

        {/* PayPal Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-zinc-900 border-b border-zinc-100 pb-2">PayPal Configuration</h3>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">PayPal Email</label>
            <input 
              type="email" 
              value={payPalEmail} 
              onChange={(e) => setPayPalEmail(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none"
              placeholder="billing@prescottnational.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">QR Code Image</label>
            <div className="flex items-center gap-4">
              {getConfigValue("paypal_qr_url") && (
                <img src={getConfigValue("paypal_qr_url")} alt="PayPal QR" className="w-16 h-16 rounded-lg object-cover border border-zinc-200" />
              )}
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => setPayPalQRFile(e.target.files?.[0] || null)}
                className="text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
              />
            </div>
          </div>
        </div>

        <button 
          onClick={saveSettings}
          disabled={loading}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
