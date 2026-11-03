"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  Send,
  User,
  Landmark,
  Shield,
  Loader2,
  RefreshCw,
  X,
  XCircle,
  Lock,
  UserPlus,
  ChevronDown
} from "lucide-react";
import { getAblyClient } from "@/lib/ably";
import { getApiBase } from "@/lib/api";

interface MessageItem {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin" | "system";
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

interface TicketItem {
  id: string;
  user_id: string;
  category?: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | "open" | "in_progress" | "resolved" | "closed";
  admin_response?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  messages?: MessageItem[];
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active chat modal / inspection
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  // Agent assignment
  const [agents, setAgents] = useState<string[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [assigningAgent, setAssigningAgent] = useState(false);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);

  // Status actions
  const [changingStatus, setChangingStatus] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ablyChannelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedTicket?.messages]);

  useEffect(() => {
    fetchTickets();
    fetchAgents();

    // Subscribe to global admin support channel
    const ably = getAblyClient();
    let adminChannel: any = null;
    if (ably) {
      adminChannel = ably.channels.get("admin:support");
      adminChannel.subscribe("support.message", () => {
        fetchTickets();
      });
    }

    // Backup polling every 8s
    const interval = setInterval(fetchTickets, 8000);

    return () => {
      clearInterval(interval);
      if (adminChannel) {
        try {
          adminChannel.unsubscribe();
        } catch (_) {}
      }
    };
  }, []);

  const fetchTickets = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      setLoading(false);
      window.location.href = "/admin/login";
      return;
    }
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/tickets?page_size=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/support-agents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (e) {
      console.error("Failed to load agents:", e);
    }
  };

  // Open ticket detail and subscribe to its live chat
  const handleOpenTicket = async (t: TicketItem) => {
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;

    setLoadingDetail(true);
    setSelectedTicket(t);
    setSelectedAgent(t.assigned_agent || "");
    setShowAgentDropdown(false);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/tickets/${t.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const detail = await res.json();
        setSelectedTicket(detail);
        setSelectedAgent(detail.assigned_agent || "");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetail(false);
    }
  };

  // Real-time Ably Subscription for the open ticket in admin view
  useEffect(() => {
    if (!selectedTicket) {
      if (ablyChannelRef.current) {
        try {
          ablyChannelRef.current.unsubscribe();
        } catch (_) {}
        ablyChannelRef.current = null;
      }
      return;
    }

    const ably = getAblyClient();
    if (ably) {
      const channelName = `support:ticket:${selectedTicket.id}`;
      const channel = ably.channels.get(channelName);
      ablyChannelRef.current = channel;

      channel.subscribe("message.new", (message: any) => {
        const newMsgData: MessageItem = message.data;
        setSelectedTicket((prev) => {
          if (!prev || prev.id !== newMsgData.ticket_id) return prev;
          const exists = prev.messages?.some((m) => m.id === newMsgData.id);
          if (exists) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), newMsgData],
          };
        });
      });
    }

    return () => {
      if (ablyChannelRef.current) {
        try {
          ablyChannelRef.current.unsubscribe();
        } catch (_) {}
        ablyChannelRef.current = null;
      }
    };
  }, [selectedTicket?.id]);

  // Assign agent to ticket
  const handleAssignAgent = async (agentName: string) => {
    if (!selectedTicket || !agentName || assigningAgent) return;
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;

    setAssigningAgent(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ agent_name: agentName })
      });
      if (res.ok) {
        setSelectedAgent(agentName);
        setSelectedTicket((prev) => prev ? { ...prev, assigned_agent: agentName } : prev);
        setShowAgentDropdown(false);
        // Refresh to get the system message
        const detail = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detail.ok) {
          setSelectedTicket(await detail.json());
        }
        fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to assign agent.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error assigning agent.");
    } finally {
      setAssigningAgent(false);
    }
  };

  // Update ticket status (close / resolve)
  const handleStatusChange = async (newStatus: string) => {
    if (!selectedTicket || changingStatus) return;
    const token = localStorage.getItem("admin_session_token");
    if (!token) return;

    setChangingStatus(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        // Refresh ticket detail
        const detail = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (detail.ok) {
          setSelectedTicket(await detail.json());
        }
        fetchTickets();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.detail || "Failed to update status.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error updating status.");
    } finally {
      setChangingStatus(false);
    }
  };

  const submitReply = async (newStatus: "IN_PROGRESS" | "RESOLVED" = "IN_PROGRESS") => {
    if (!selectedTicket || !replyMessage.trim() || sendingReply) return;
    const token = localStorage.getItem("admin_session_token");
    if (!token) {
      alert("Admin session expired. Please log in again.");
      window.location.href = "/admin/login";
      return;
    }

    const outText = replyMessage.trim();
    setSendingReply(true);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          admin_response: outText,
          status: newStatus.toLowerCase(),
          agent_name: selectedAgent || undefined
        })
      });

      if (res.ok) {
        setReplyMessage("");
        const updatedData = await res.json().catch(() => null);
        if (updatedData && updatedData.messages) {
          setSelectedTicket(updatedData);
        } else {
          // Reload details
          const updated = await fetch(`${apiBase}/admin/tickets/${selectedTicket.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (updated.ok) {
            setSelectedTicket(await updated.json());
          }
        }
        fetchTickets();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to send admin reply.");
      }
    } catch (e) {
      console.error(e);
      alert("Network error sending admin reply.");
    } finally {
      setSendingReply(false);
    }
  };

  const normalizeStatus = (status: string): string => {
    return String(status).toLowerCase().replace("ticketstatus.", "");
  };

  const isTicketLocked = (ticket: TicketItem | null): boolean => {
    if (!ticket) return false;
    const s = normalizeStatus(ticket.status);
    return s === "resolved" || s === "closed";
  };

  const getStatusBadge = (status: string) => {
    const s = normalizeStatus(status);
    if (s === "open") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          OPEN (Live)
        </span>
      );
    }
    if (s === "in_progress") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          <Clock className="w-3 h-3" />
          IN PROGRESS
        </span>
      );
    }
    if (s === "closed") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
          <XCircle className="w-3 h-3" />
          CLOSED
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
        <CheckCircle2 className="w-3 h-3" />
        RESOLVED
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const locked = isTicketLocked(selectedTicket);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2.5">
            Support Desk & Live Inquiries
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time commercial support desk with agent assignment, automated routing, and instant client dispatch.
          </p>
        </div>

        <button
          onClick={fetchTickets}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 text-zinc-600 hover:bg-zinc-50 text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-600">
            <thead className="bg-zinc-50 border-b border-zinc-200 text-xs font-medium text-zinc-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Subject</th>
                <th className="px-6 py-4">Assigned Agent</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                    No support tickets found.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const s = normalizeStatus(t.status);
                  return (
                    <tr key={t.id} className={`hover:bg-zinc-50/50 transition-colors ${s === "resolved" || s === "closed" ? "opacity-60" : ""}`}>
                      <td className="px-6 py-4 font-semibold text-purple-700 whitespace-nowrap">
                        {t.category || "General Support"}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900 max-w-xs truncate">
                        {t.subject}
                      </td>
                      <td className="px-6 py-4 text-zinc-600 whitespace-nowrap">
                        {t.assigned_agent ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-1 rounded-lg">
                            <User className="w-3 h-3" />
                            {t.assigned_agent}
                          </span>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(t.status)}
                      </td>
                      <td className="px-6 py-4 text-xs text-zinc-400 whitespace-nowrap">
                        {new Date(t.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleOpenTicket(t)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          {s === "open" || s === "in_progress" ? "Live Chat" : "View Thread"}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Real-time Interactive Chat Drawer / Modal for Admin */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-2xl flex flex-col max-h-[90vh] shadow-2xl overflow-hidden border border-zinc-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-zinc-200 bg-zinc-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">
                      {selectedTicket.category || "Priority Support"}
                    </span>
                    {getStatusBadge(selectedTicket.status)}
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 mt-0.5 truncate">
                    {selectedTicket.subject}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Ref #{selectedTicket.id.slice(0, 8).toUpperCase()} • User ID: {selectedTicket.user_id.slice(0, 8)}...
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors flex-shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Agent Assignment & Status Controls */}
              <div className="flex items-center gap-3 mt-3 flex-wrap">
                {/* Agent Assignment */}
                <div className="relative">
                  <button
                    onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                    disabled={assigningAgent}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border rounded-lg transition-colors bg-white hover:bg-purple-50 text-purple-700 border-purple-200"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    {selectedAgent || "Assign Agent"}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {showAgentDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl z-10 w-56 py-1 max-h-60 overflow-y-auto">
                      {agents.map((agent) => (
                        <button
                          key={agent}
                          onClick={() => handleAssignAgent(agent)}
                          className={`w-full text-left px-4 py-2.5 text-sm hover:bg-purple-50 transition-colors flex items-center justify-between ${
                            selectedAgent === agent ? "bg-purple-50 text-purple-700 font-semibold" : "text-zinc-700"
                          }`}
                        >
                          <span>{agent}</span>
                          {selectedAgent === agent && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status Actions */}
                {!locked && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange("resolved")}
                      disabled={changingStatus}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Resolve
                    </button>
                    <button
                      onClick={() => handleStatusChange("closed")}
                      disabled={changingStatus}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <XCircle className="w-3 h-3" />
                      Close
                    </button>
                  </div>
                )}

                {locked && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-zinc-500 bg-zinc-100 rounded-lg border border-zinc-200">
                    <Lock className="w-3 h-3" />
                    Conversation Ended
                  </div>
                )}
              </div>
            </div>

            {/* Conversation Messages Thread */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 max-h-[380px] bg-zinc-50/50">
              {loadingDetail ? (
                <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                  <span className="text-xs">Loading thread history...</span>
                </div>
              ) : selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                selectedTicket.messages.map((m) => {
                  const isUser = m.sender_type === "user";
                  const isSystem = m.sender_type === "system";

                  if (isSystem) {
                    return (
                      <div key={m.id} className="flex justify-center my-2">
                        <div className="max-w-lg w-full bg-zinc-100 border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800">
                          <div className="flex items-center gap-1.5 font-semibold text-zinc-800 mb-1">
                            <Landmark className="w-3.5 h-3.5 text-zinc-600" />
                            <span>{m.sender_name}</span>
                            <span className="ml-auto text-[10px] text-zinc-500 font-normal">
                              {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <p className="whitespace-pre-wrap leading-relaxed text-zinc-700">{m.content}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={m.id}
                      className={`flex items-end gap-2.5 ${isUser ? "justify-start" : "justify-end"}`}
                    >
                      {isUser && (
                        <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-600 flex-shrink-0 text-xs font-bold">
                          <User className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-md rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-sm ${
                          isUser
                            ? "bg-white border border-zinc-200 text-zinc-800 rounded-bl-none"
                            : "bg-purple-600 text-white rounded-br-none"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 text-[10px] opacity-75 mb-1">
                          <span className="font-semibold">{m.sender_name}</span>
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                      </div>

                      {!isUser && (
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 flex-shrink-0 text-xs font-bold">
                          {m.sender_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white p-4 rounded-xl border border-zinc-200 text-xs text-zinc-600">
                  <p className="font-bold text-zinc-800 mb-1">Initial Client Message:</p>
                  <p>{selectedTicket.message}</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Admin Reply Composer — only if not locked */}
            {locked ? (
              <div className="p-4 border-t border-zinc-200 bg-zinc-50 flex items-center justify-center gap-2 text-sm text-zinc-500 font-medium">
                <Lock className="w-4 h-4 text-zinc-400" />
                This conversation has been closed. No further replies can be sent.
              </div>
            ) : (
              <div className="p-4 border-t border-zinc-200 bg-white space-y-3">
                <div className="flex items-center gap-2">
                  {selectedAgent && (
                    <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg border border-purple-100">
                      Replying as: {selectedAgent}
                    </span>
                  )}
                  {!selectedAgent && (
                    <span className="text-xs text-amber-600 font-medium">
                      ⚠ No agent assigned — messages will show as &quot;Support Team&quot;
                    </span>
                  )}
                </div>

                <textarea
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type response to client (dispatches instantly in real time)..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-sm border border-zinc-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-zinc-400">
                    Live sync active • Client receives message without page refresh
                  </span>

                  <div className="flex gap-2">
                    <button
                      onClick={() => submitReply("IN_PROGRESS")}
                      disabled={!replyMessage.trim() || sendingReply}
                      className="px-3 py-2 rounded-xl text-xs font-semibold border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 disabled:opacity-50 transition-colors"
                    >
                      Reply & Keep Open
                    </button>

                    <button
                      onClick={() => submitReply("RESOLVED")}
                      disabled={!replyMessage.trim() || sendingReply}
                      className="px-4 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 flex items-center gap-1.5 shadow transition-colors"
                    >
                      {sendingReply ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          Send & Resolve
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
