"use client";

import React, { useEffect, useState } from "react";
import { MoreVertical, Edit, Trash2, Ban, CheckCircle, Sparkles, Lock, Unlock, ShieldAlert, Plane } from "lucide-react";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";
import GenerateTransactionsModal from "@/components/admin/GenerateTransactionsModal";
import GenerateAirlineBookingModal from "@/components/admin/GenerateAirlineBookingModal";

const DEFAULT_PND_REASON = "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity.";

const HOLD_REASON_PRESETS = [
  {
    label: "Unknown Device / Location",
    text: "We detected an unrecognized sign-in attempt from an unknown device and unfamiliar location. A temporary security hold has been placed to protect your account from unauthorized activity."
  },
  {
    label: "Unusual Activity Flagged",
    text: "Unusual transaction activity was flagged by automated fraud monitoring. Outgoing transfers and card payments are paused to protect your funds."
  },
  {
    label: "Suspected Unauthorized Access",
    text: "Potential unauthorized access was detected on your account. Outgoing debits and wire transfers have been paused to safeguard your balance."
  },
  {
    label: "ID Verification Required",
    text: "Identity verification is required following high-volume activity. Outgoing transfers are paused until your identification documents are re-confirmed."
  },
];
const DEFAULT_BAN_REASON = "Account permanently suspended due to terms of service violation, unauthorized activity, or regulatory risk.";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [editingUser, setEditingUser] = useState<any>(null);
  const [banningUser, setBanningUser] = useState<any>(null);
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [freezingUser, setFreezingUser] = useState<any>(null);
  
  const [banReason, setBanReason] = useState(DEFAULT_BAN_REASON);
  const [freezeReason, setFreezeReason] = useState(DEFAULT_PND_REASON);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const [editFormData, setEditFormData] = useState<any>({});

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isAirlineModalOpen, setIsAirlineModalOpen] = useState(false);
  const [selectedUserForGen, setSelectedUserForGen] = useState<string>("");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/users?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUsers(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (u: any) => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    setApprovingId(u.id);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/users/${u.id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success(`Account for ${u.full_name} has been approved and confirmation email sent!`);
        setMenuOpenId(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to approve account");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve account");
    } finally {
      setApprovingId(null);
    }
  };

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const toggleMenu = (id: string) => {
    setMenuOpenId(menuOpenId === id ? null : id);
  };

  const [editLoading, setEditLoading] = useState(false);

  const handleEditClick = (u: any) => {
    setEditingUser(u);
    let formattedCreatedAt = "";
    if (u.created_at) {
      try {
        formattedCreatedAt = new Date(u.created_at).toISOString().split("T")[0];
      } catch (e) {
        formattedCreatedAt = "";
      }
    }
    setEditFormData({
      full_name: u.full_name || "",
      username: u.username || "",
      email: u.email || "",
      phone_number: u.phone_number || "",
      dob: u.dob || "",
      sex: u.sex || "",
      country: u.country || "US",
      state: u.state || "",
      city: u.city || "",
      zip_code: u.zip_code || "",
      created_at: formattedCreatedAt,
    });
    setMenuOpenId(null);
  };

  const handleBanClick = (u: any) => {
    setBanningUser(u);
    setBanReason(u.ban_reason || DEFAULT_BAN_REASON);
    setMenuOpenId(null);
  };

  const handleFreezeClick = (u: any) => {
    setFreezingUser(u);
    setFreezeReason(u.account?.freeze_reason || DEFAULT_PND_REASON);
    setMenuOpenId(null);
  };

  const submitFreeze = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token || !freezingUser) return;
    setFreezeLoading(true);
    try {
      const isCurrentlyFrozen = freezingUser.account?.is_frozen === true;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/accounts/${freezingUser.id}/freeze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_frozen: !isCurrentlyFrozen,
          freeze_reason: !isCurrentlyFrozen ? freezeReason : null
        })
      });
      if (res.ok) {
        toast.success(
          !isCurrentlyFrozen 
            ? `Account hold placed successfully.`
            : `Account hold removed successfully.`
        );
        setFreezingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to update account restriction status");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update account restriction status");
    } finally {
      setFreezeLoading(false);
    }
  };

  const handleDeleteClick = (u: any) => {
    setDeletingUser(u);
    setMenuOpenId(null);
  };

  const submitEdit = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token || !editingUser) return;
    setEditLoading(true);
    try {
      const apiBase = getApiBase();
      const payload: any = { ...editFormData };
      if (payload.created_at) {
        payload.created_at = new Date(payload.created_at + "T12:00:00Z").toISOString();
      } else {
        delete payload.created_at;
      }
      const res = await fetch(`${apiBase}/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast.success(`User profile updated successfully!`);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.detail || "Failed to update user profile");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to update user profile");
    } finally {
      setEditLoading(false);
    }
  };

  const submitBan = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const isUnbanning = banningUser.is_active === false;
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/users/${banningUser.id}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          is_active: isUnbanning, // If currently banned, unban.
          ban_reason: isUnbanning ? null : banReason
        })
      });
      if (res.ok) {
        setBanningUser(null);
        setBanReason("");
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const submitDelete = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/users/${deletingUser.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (res.ok) {
        setDeletingUser(null);
        fetchUsers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Title and Generator CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-zinc-950">Users Management</h1>
          <p className="text-xs text-zinc-500">Review, approve, and manage customer accounts & ledgers.</p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setSelectedUserForGen("");
              setIsAirlineModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <Plane className="w-4 h-4" />
            <span>Generate Airline Booking</span>
          </button>
          <button
            onClick={() => {
              setSelectedUserForGen("");
              setIsGenModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1faa6e] hover:bg-[#18935f] text-white text-xs font-semibold rounded-2xl shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Transaction History</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Name / Email</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">DOB / Gender</th>
                <th className="px-6 py-4">Location (ZIP)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-zinc-50/50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-zinc-900">{u.full_name}</div>
                    <div className="text-zinc-500 text-xs">{u.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    {!u.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
                        <Ban className="w-3 h-3" /> Banned
                      </span>
                    ) : !u.is_approved ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                        Pending Review
                      </span>
                    ) : u.account?.is_frozen ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-900 border border-orange-200" title={`Hold Reason: ${u.account.freeze_reason || 'Under Review'}`}>
                        <Lock className="w-3 h-3 text-orange-700" /> Account Hold
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>{u.dob || "N/A"}</div>
                    <div className="text-xs text-zinc-400 capitalize">{u.sex || "N/A"}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{u.city}, {u.state}</div>
                    <div className="text-xs text-zinc-400">{u.zip_code}</div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    {!u.is_approved && (
                      <button 
                        onClick={() => handleApproveUser(u)}
                        disabled={approvingId === u.id}
                        className="inline-flex items-center mr-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1faa6e] hover:bg-[#18935f] text-white shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
                        title="Approve User Application"
                      >
                        {approvingId === u.id ? (
                          <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin mr-1.5" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                        )}
                        Approve
                      </button>
                    )}
                    <button 
                      onClick={() => toggleMenu(u.id)}
                      className="p-2 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    {menuOpenId === u.id && (
                      <div className="absolute right-8 top-10 w-56 bg-white border border-zinc-200 rounded-2xl shadow-xl z-20 py-1.5 overflow-hidden">
                        {!u.is_approved && (
                          <button 
                            onClick={() => handleApproveUser(u)}
                            className="w-full flex items-center px-4 py-2 text-sm text-[#1faa6e] font-semibold hover:bg-emerald-50 text-left cursor-pointer"
                          >
                            <CheckCircle className="w-4 h-4 mr-2 text-[#1faa6e]" /> Approve Account
                          </button>
                        )}
                        <button 
                          onClick={() => handleFreezeClick(u)}
                          className={`w-full flex items-center px-4 py-2 text-sm font-semibold text-left cursor-pointer ${
                            u.account?.is_frozen ? "text-emerald-700 hover:bg-emerald-50" : "text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          {u.account?.is_frozen ? (
                            <>
                              <Unlock className="w-4 h-4 mr-2 text-emerald-600" /> Remove Hold
                            </>
                          ) : (
                            <>
                              <Lock className="w-4 h-4 mr-2 text-amber-600" /> Place Account Hold
                            </>
                          )}
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUserForGen(u.id);
                            setIsGenModalOpen(true);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-zinc-700 font-medium hover:bg-zinc-50 text-left cursor-pointer"
                        >
                          <Sparkles className="w-4 h-4 mr-2 text-[#1faa6e]" /> Generate History
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedUserForGen(u.id);
                            setIsAirlineModalOpen(true);
                            setMenuOpenId(null);
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-sky-700 font-medium hover:bg-sky-50 text-left cursor-pointer"
                        >
                          <Plane className="w-4 h-4 mr-2 text-sky-600" /> Book Flight Transaction
                        </button>
                        <button 
                          onClick={() => handleEditClick(u)}
                          className="w-full flex items-center px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50 text-left cursor-pointer"
                        >
                          <Edit className="w-4 h-4 mr-2 text-zinc-400" /> Edit User
                        </button>
                        <button 
                          onClick={() => handleBanClick(u)}
                          className={`w-full flex items-center px-4 py-2 text-sm font-medium text-left cursor-pointer ${
                            u.is_active ? "text-red-600 hover:bg-red-50" : "text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          <Ban className="w-4 h-4 mr-2 text-red-500" /> 
                          {u.is_active ? "Full Ban Account" : "Unban Account"}
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(u)}
                          className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4 mr-2 text-red-600" /> Delete User
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 md:p-8 border border-zinc-200 shadow-2xl flex flex-col gap-6 text-zinc-900 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center">
                  <Edit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-950">Edit User Account</h3>
                  <p className="text-xs text-zinc-500">Update personal KYC identity, address, and banking membership date.</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-zinc-400 hover:text-zinc-600 p-2 rounded-xl hover:bg-zinc-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                submitEdit();
              }} 
              className="space-y-6"
            >
              {/* Section 1: Personal & Identity */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Personal & Identity Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Full Legal Name</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.full_name} 
                      onChange={(e) => setEditFormData({...editFormData, full_name: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Username</label>
                    <input 
                      type="text" 
                      required
                      value={editFormData.username} 
                      onChange={(e) => setEditFormData({...editFormData, username: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={editFormData.email} 
                      onChange={(e) => setEditFormData({...editFormData, email: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Phone Number</label>
                    <input 
                      type="text" 
                      value={editFormData.phone_number} 
                      onChange={(e) => setEditFormData({...editFormData, phone_number: e.target.value})}
                      placeholder="+1 (555) 000-0000"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Date of Birth (DOB)</label>
                    <input 
                      type="text" 
                      value={editFormData.dob} 
                      onChange={(e) => setEditFormData({...editFormData, dob: e.target.value})}
                      placeholder="YYYY-MM-DD or MM/DD/YYYY"
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Gender / Sex</label>
                    <select 
                      value={editFormData.sex} 
                      onChange={(e) => setEditFormData({...editFormData, sex: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Address & Location */}
              <div>
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                  Location & Address (KYC)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">Country</label>
                    <select 
                      value={editFormData.country} 
                      onChange={(e) => setEditFormData({...editFormData, country: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all cursor-pointer"
                    >
                      <option value="US">United States (USD $)</option>
                      <option value="GB">United Kingdom (GBP £)</option>
                      <option value="CA">Canada (CAD $)</option>
                      <option value="AU">Australia (AUD $)</option>
                      <option value="DE">Germany (EUR €)</option>
                      <option value="FR">France (EUR €)</option>
                      <option value="NG">Nigeria (NGN ₦)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">State / Province</label>
                    <input 
                      type="text" 
                      value={editFormData.state} 
                      onChange={(e) => setEditFormData({...editFormData, state: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">City</label>
                    <input 
                      type="text" 
                      value={editFormData.city} 
                      onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 mb-1">ZIP / Postal Code</label>
                    <input 
                      type="text" 
                      value={editFormData.zip_code} 
                      onChange={(e) => setEditFormData({...editFormData, zip_code: e.target.value})}
                      className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Date Joined / Member Since */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-950 uppercase tracking-wider">
                    Date Joined / Member Since
                  </label>
                  <span className="text-[10px] text-purple-700 font-medium">Historical Bank Record</span>
                </div>
                <input 
                  type="date" 
                  value={editFormData.created_at} 
                  onChange={(e) => setEditFormData({...editFormData, created_at: e.target.value})}
                  className="w-full px-3.5 py-2.5 bg-white border border-purple-200 rounded-xl text-xs font-medium text-zinc-900 focus:outline-none focus:border-purple-600 transition-all cursor-pointer"
                />
                <p className="text-[11px] text-purple-800/80 leading-relaxed">
                  Backdate or adjust the official date this customer joined Prescott National Bank (e.g. 2018, 2021). This date will immediately show on the user's dashboard and profile under "Member Since".
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingUser(null)} 
                  disabled={editLoading}
                  className="flex-1 py-3 rounded-2xl border border-zinc-200 font-semibold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={editLoading}
                  className="flex-1 py-3 rounded-2xl bg-purple-600 text-white font-semibold text-xs hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                >
                  {editLoading ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-No-Debit (PND) / Freeze Modal */}
      {freezingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 md:p-8 border border-zinc-200 shadow-2xl flex flex-col gap-5 text-zinc-900">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                freezingUser.account?.is_frozen ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-amber-50 text-amber-600 border border-amber-200"
              }`}>
                {freezingUser.account?.is_frozen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {freezingUser.account?.is_frozen ? "Remove Security Hold" : "Place Security Hold on Account"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {freezingUser.full_name} ({freezingUser.email})
                </p>
              </div>
            </div>

            {freezingUser.account?.is_frozen ? (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                  <p className="font-bold">Restore Full Account Access</p>
                  <p className="leading-relaxed">
                    Removing this hold will immediately restore the customer's ability to initiate wire transfers, ACH debits, P2P transfers, virtual card spending, and withdrawals.
                  </p>
                </div>
                {freezingUser.account?.freeze_reason && (
                  <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs">
                    <span className="font-semibold text-zinc-600 block mb-1">Current Active Hold Reason:</span>
                    <span className="text-zinc-800 italic">"{freezingUser.account.freeze_reason}"</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold">Account Hold Policy</p>
                  <p className="leading-relaxed">
                    While on hold, this account can <strong>still receive incoming deposits</strong> (Direct Deposit, Wires, ACH credits, Mobile Checks), but <strong>all outgoing transactions are paused</strong> (Transfers, Bill Payments, Card Debits, Cash Withdrawals).
                  </p>
                  <p className="text-[11px] text-amber-800/80 pt-1">
                    When the customer attempts an outgoing transfer, they will see a secure account notice with this reason and instructions to verify their identity.
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                      Reason Displayed to Customer
                    </label>
                    <button
                      type="button"
                      onClick={() => setFreezeReason(DEFAULT_PND_REASON)}
                      className="text-[10px] font-semibold text-[#1faa6e] hover:underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {HOLD_REASON_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFreezeReason(preset.text)}
                        className={`text-[10px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                          freezeReason === preset.text
                            ? "bg-amber-100 border-amber-300 text-amber-900 font-semibold"
                            : "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={freezeReason}
                    onChange={(e) => setFreezeReason(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 border border-zinc-200 rounded-2xl text-xs text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:border-[#1faa6e] transition-all leading-relaxed"
                    placeholder="Enter reason for account hold..."
                    required
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Pre-filled with standard security template. You can customize this reason anytime.
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setFreezingUser(null)} 
                disabled={freezeLoading}
                className="flex-1 py-3 rounded-2xl border border-zinc-200 font-semibold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={submitFreeze} 
                disabled={freezeLoading}
                className={`flex-1 py-3 rounded-2xl text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 ${
                  freezingUser.account?.is_frozen
                    ? "bg-[#1faa6e] hover:bg-[#18935f]"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {freezeLoading ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : freezingUser.account?.is_frozen ? (
                  "Remove Hold"
                ) : (
                  "Place Account Hold"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {banningUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 md:p-8 border border-zinc-200 shadow-2xl flex flex-col gap-5 text-zinc-900">
            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                banningUser.is_active ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
              }`}>
                {banningUser.is_active ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-950">
                  {banningUser.is_active ? "Full Ban Account" : "Unban Account"}
                </h3>
                <p className="text-xs text-zinc-500">
                  {banningUser.full_name} ({banningUser.email})
                </p>
              </div>
            </div>

            {banningUser.is_active ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 leading-relaxed">
                  <strong>Full Ban Effect:</strong> The user will be completely blocked from logging into online banking. When they try to log in, an official suspension notice modal will appear displaying the ban reason.
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                      Reason for Ban (Shown on Login Screen)
                    </label>
                    <button
                      type="button"
                      onClick={() => setBanReason(DEFAULT_BAN_REASON)}
                      className="text-[10px] font-semibold text-red-600 hover:underline"
                    >
                      Reset to Default
                    </button>
                  </div>
                  <textarea 
                    value={banReason}
                    onChange={(e) => setBanReason(e.target.value)}
                    rows={3}
                    className="w-full p-3.5 border border-zinc-200 rounded-2xl text-xs text-zinc-900 bg-zinc-50 focus:bg-white focus:outline-none focus:border-red-500 transition-all leading-relaxed"
                    placeholder="Enter reason for suspension..."
                  />
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                Confirm restoring login access for <strong>{banningUser.full_name}</strong>. The user will be able to log in normally.
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                type="button"
                onClick={() => setBanningUser(null)} 
                className="flex-1 py-3 rounded-2xl border border-zinc-200 font-semibold text-xs text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={submitBan} 
                className={`flex-1 py-3 rounded-2xl text-white font-semibold text-xs transition-colors ${
                  banningUser.is_active ? "bg-red-600 hover:bg-red-700" : "bg-[#1faa6e] hover:bg-[#18935f]"
                }`}
              >
                {banningUser.is_active ? "Confirm Full Ban" : "Confirm Unban"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Delete User?</h3>
            <p className="text-zinc-600 mb-6">Are you sure you want to permanently delete {deletingUser.full_name}? This action cannot be undone.</p>
            <div className="flex gap-4">
              <button onClick={() => setDeletingUser(null)} className="flex-1 py-2 rounded-xl border border-zinc-200 font-medium text-zinc-600">Cancel</button>
              <button onClick={submitDelete} className="flex-1 py-2 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700">Delete</button>
            </div>
          </div>
        </div>
      )}

      <GenerateTransactionsModal
        isOpen={isGenModalOpen}
        initialUserId={selectedUserForGen}
        usersList={users}
        onClose={() => setIsGenModalOpen(false)}
        onSuccess={() => {
          setIsGenModalOpen(false);
          fetchUsers();
        }}
      />

      <GenerateAirlineBookingModal
        isOpen={isAirlineModalOpen}
        initialUserId={selectedUserForGen}
        usersList={users}
        onClose={() => setIsAirlineModalOpen(false)}
        onSuccess={() => {
          setIsAirlineModalOpen(false);
          fetchUsers();
        }}
      />
    </div>
  );
}
