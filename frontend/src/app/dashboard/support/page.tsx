"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Headphones,
  Send,
  CreditCard,
  ArrowDownToLine,
  ShieldCheck,
  Landmark,
  Clock,
  MessageSquare,
  ChevronRight,
  Plus,
  ArrowLeft,
  CheckCircle2,
  User,
  Shield,
  Loader2,
  AlertCircle,
  Lock,
  XCircle
} from "lucide-react";
import { getApiBase } from "@/lib/api";
import { getAblyClient } from "@/lib/ably";

interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_type: "user" | "admin" | "system";
  sender_name: string;
  content: string;
  is_read: boolean;
  created_at: string;
  status_change?: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  admin_response?: string;
  assigned_agent?: string;
  created_at: string;
  updated_at: string;
  last_message?: string;
  last_sender?: string;
  unread_count?: number;
  messages?: SupportMessage[];
}

interface DepartmentTopic {
  id: string;
  name: string;
  icon: any;
  description: string;
  badge: string;
  typical_response_time: string;
  promptSuggestions: string[];
}

const DEPARTMENTS: DepartmentTopic[] = [
  {
    id: "transfers-wires",
    name: "Transfers & Wires",
    icon: Send,
    description: "Domestic and international wire transfers, ACH payments, and transfer status inquiries.",
    badge: "Transfers",
    typical_response_time: "~3 min",
    promptSuggestions: [
      "Check the status of a pending wire transfer",
      "I need a copy of my wire confirmation",
      "My transfer hasn't arrived yet",
    ],
  },
  {
    id: "cards-limits",
    name: "Cards & Limits",
    icon: CreditCard,
    description: "Debit cards, virtual cards, spending limits, card replacements, and transaction disputes.",
    badge: "Cards",
    typical_response_time: "~2 min",
    promptSuggestions: [
      "I need to increase my daily spending limit",
      "My card was declined but I have funds",
      "I don't recognize a charge on my account",
    ],
  },
  {
    id: "deposits-settlement",
    name: "Deposits",
    icon: ArrowDownToLine,
    description: "Direct deposits, mobile check deposits, deposit holds, and incoming wire credits.",
    badge: "Deposits",
    typical_response_time: "~3 min",
    promptSuggestions: [
      "When will my deposit be available?",
      "There's a hold on my mobile deposit",
      "I need to set up direct deposit",
    ],
  },
  {
    id: "security-access",
    name: "Security & Access",
    icon: ShieldCheck,
    description: "Login issues, two-factor authentication, account holds, and security concerns.",
    badge: "Security",
    typical_response_time: "~1 min",
    promptSuggestions: [
      "I'm locked out of my account",
      "I need to reset my two-factor authentication",
      "There's a hold on my account I need removed",
    ],
  },
  {
    id: "loans-credit",
    name: "Loans & Credit",
    icon: Landmark,
    description: "Loan payments, payoff requests, interest statements, and credit facility questions.",
    badge: "Lending",
    typical_response_time: "~5 min",
    promptSuggestions: [
      "I need a payoff quote for my loan",
      "Question about my loan payment schedule",
      "I'd like to make an extra payment",
    ],
  },
  {
    id: "general",
    name: "General Help",
    icon: Headphones,
    description: "Account statements, tax documents, fees, and anything else we can help with.",
    badge: "General",
    typical_response_time: "~3 min",
    promptSuggestions: [
      "I need an official bank statement",
      "Question about a fee on my account",
      "I need my tax documents (1099)",
    ],
  },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingActiveTicket, setLoadingActiveTicket] = useState(false);

  // New ticket modal / screen states
  const [selectedDept, setSelectedDept] = useState<DepartmentTopic | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  // Chat message input
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ablyChannelRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeTicket?.messages]);

  useEffect(() => {
    fetchTickets();
  }, []);

  // Helper to check if a ticket is locked (resolved or closed)
  const isTicketLocked = (ticket: SupportTicket | null): boolean => {
    if (!ticket) return false;
    const s = String(ticket.status).toLowerCase().replace("ticketstatus.", "");
    return s === "resolved" || s === "closed";
  };

  const fetchTickets = async () => {
    const token = localStorage.getItem("session_token");
    if (!token) {
      setLoadingTickets(false);
      return;
    }
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/support/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (err) {
      console.error("Failed to load support tickets:", err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const openTicket = async (ticketId: string) => {
    const token = localStorage.getItem("session_token");
    if (!token) return;

    setLoadingActiveTicket(true);
    setSelectedDept(null);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/support/tickets/${ticketId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const fullTicket: SupportTicket = await res.json();
        setActiveTicket(fullTicket);
      }
    } catch (err) {
      console.error("Failed to fetch ticket conversation:", err);
    } finally {
      setLoadingActiveTicket(false);
    }
  };

  // Real-time Ably Subscription for the active ticket
  useEffect(() => {
    if (!activeTicket) {
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
      const channelName = `support:ticket:${activeTicket.id}`;
      const channel = ably.channels.get(channelName);
      ablyChannelRef.current = channel;

      channel.subscribe("message.new", (message: any) => {
        const newMsgData: SupportMessage = message.data;
        // Check for status change in real-time
        if (newMsgData.status_change) {
          setActiveTicket((prev) => {
            if (!prev || prev.id !== newMsgData.ticket_id) return prev;
            const exists = prev.messages?.some((m) => m.id === newMsgData.id);
            return {
              ...prev,
              status: newMsgData.status_change as any,
              messages: exists ? prev.messages : [...(prev.messages || []), newMsgData],
            };
          });
        } else {
          setActiveTicket((prev) => {
            if (!prev || prev.id !== newMsgData.ticket_id) return prev;
            const exists = prev.messages?.some((m) => m.id === newMsgData.id);
            if (exists) return prev;
            return {
              ...prev,
              messages: [...(prev.messages || []), newMsgData],
            };
          });
        }
        fetchTickets();
      });
    }

    const pollInterval = setInterval(async () => {
      const token = localStorage.getItem("session_token");
      if (!token || !activeTicket) return;
      try {
        const apiBase = getApiBase();
        const res = await fetch(`${apiBase}/support/tickets/${activeTicket.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const freshTicket: SupportTicket = await res.json();
          setActiveTicket((prev) => {
            if (!prev) return freshTicket;
            if (
              freshTicket.messages?.length !== prev.messages?.length ||
              freshTicket.status !== prev.status
            ) {
              return freshTicket;
            }
            return prev;
          });
        }
      } catch (_) {}
    }, 6000);

    return () => {
      clearInterval(pollInterval);
      if (ablyChannelRef.current) {
        try {
          ablyChannelRef.current.unsubscribe();
        } catch (_) {}
        ablyChannelRef.current = null;
      }
    };
  }, [activeTicket?.id]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept || !newSubject.trim() || !newMessage.trim()) return;

    const token = localStorage.getItem("session_token");
    if (!token) return;

    setSubmittingTicket(true);
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/support/tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          category: selectedDept.name,
          subject: newSubject.trim(),
          message: newMessage.trim(),
        }),
      });

      if (res.ok) {
        const createdTicket: SupportTicket = await res.json();
        setActiveTicket(createdTicket);
        setSelectedDept(null);
        setNewSubject("");
        setNewMessage("");
        fetchTickets();
      } else {
        alert("Failed to initiate live support request. Please try again.");
      }
    } catch (err) {
      console.error("Error creating ticket:", err);
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !chatInput.trim() || sendingMsg) return;

    // Double-check: don't allow sending on locked tickets
    if (isTicketLocked(activeTicket)) return;

    const token = localStorage.getItem("session_token");
    if (!token) {
      alert("Your session has expired. Please sign in again.");
      window.location.href = "/login";
      return;
    }

    const outgoingText = chatInput.trim();
    setSendingMsg(true);

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/support/tickets/${activeTicket.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: outgoingText }),
      });

      if (res.ok) {
        const postedMsg: SupportMessage = await res.json();
        setChatInput("");
        setActiveTicket((prev) => {
          if (!prev) return prev;
          if (prev.messages?.some((m) => m.id === postedMsg.id)) return prev;
          return {
            ...prev,
            messages: [...(prev.messages || []), postedMsg],
          };
        });
        fetchTickets();
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || "Failed to deliver message to support desk.");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      alert("Network connection error. Please try again.");
    } finally {
      setSendingMsg(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = String(status).toLowerCase().replace("ticketstatus.", "");
    switch (s) {
      case "open":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
            Open
          </span>
        );
      case "in_progress":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            In Progress
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-600" />
            Resolved
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
            <XCircle className="w-3.5 h-3.5 text-red-500" />
            Closed
          </span>
        );
      default:
        return null;
    }
  };

  const locked = isTicketLocked(activeTicket);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-zinc-200 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#1faa6e] shadow-sm">
              <Headphones className="w-6 h-6 text-[#1faa6e]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-bold text-zinc-900 tracking-tight">
                  Help & Support
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                  Online
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
                Chat with our support team in real time.
              </p>
            </div>
          </div>
        </div>

        {activeTicket && (
          <button
            onClick={() => {
              setActiveTicket(null);
              setSelectedDept(null);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-white hover:bg-zinc-50 text-zinc-800 transition-all border border-zinc-300 shadow-sm"
          >
            <Plus className="w-4 h-4 text-[#1faa6e]" />
            New Support Request
          </button>
        )}
      </div>

      {/* Main Grid: Sidebar Inquiries + Department/Chat Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Recent Inquiries List */}
        <div
          className={`lg:col-span-4 flex flex-col bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm overflow-hidden ${
            activeTicket ? "hidden lg:flex" : "flex"
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1faa6e]" />
              Your Inquiries
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-800 font-bold border border-zinc-200">
              {tickets.length} total
            </span>
          </div>

          <div className="flex-1 overflow-y-auto mt-4 space-y-2.5 pr-1 max-h-[560px]">
            {loadingTickets ? (
              <div className="py-12 flex flex-col items-center justify-center text-zinc-600 gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#1faa6e]" />
                <span className="text-xs font-medium">Loading requests...</span>
              </div>
            ) : tickets.length === 0 ? (
              <div className="py-12 text-center text-zinc-600 text-xs px-4 bg-zinc-50 rounded-xl border border-zinc-200/80">
                <p className="font-bold text-zinc-800 text-sm mb-1">No Active Inquiries</p>
                <p className="text-zinc-600 leading-relaxed font-medium">
                  Select a banking department on the right to start a secure priority conversation.
                </p>
              </div>
            ) : (
              tickets.map((t) => {
                const isSelected = activeTicket?.id === t.id;
                const tStatus = String(t.status).toLowerCase().replace("ticketstatus.", "");
                const isClosed = tStatus === "resolved" || tStatus === "closed";
                return (
                  <button
                    key={t.id}
                    onClick={() => openTicket(t.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      isSelected
                        ? "bg-emerald-50/80 border-emerald-400 shadow-sm ring-1 ring-emerald-300"
                        : isClosed
                        ? "bg-zinc-50 border-zinc-200 hover:bg-zinc-100 hover:border-zinc-300 opacity-75"
                        : "bg-white border-zinc-200 hover:bg-zinc-50 hover:border-zinc-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 truncate max-w-[150px]">
                        {t.category || "General Support"}
                      </span>
                      {getStatusBadge(t.status)}
                    </div>
                    <p className="text-sm font-bold text-zinc-900 truncate">{t.subject}</p>
                    <p className="text-xs text-zinc-600 font-medium truncate mt-1">
                      {t.last_sender ? `${t.last_sender}: ` : ""}
                      {t.last_message || t.message}
                    </p>
                    <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-zinc-200/80 text-[11px] text-zinc-500 font-semibold">
                      <span>Ref #{t.id.slice(0, 8).toUpperCase()}</span>
                      <span>{new Date(t.updated_at || t.created_at).toLocaleDateString()}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Active Chat View OR Department Selection Screen */}
        <div className="lg:col-span-8 flex flex-col min-h-[580px]">
          {activeTicket ? (
            /* ── CHAT ROOM VIEW ── */
            <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm">
              {/* Chat Header */}
              <div className="px-5 py-4 border-b border-zinc-200 bg-zinc-50/90 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveTicket(null)}
                    className="lg:hidden p-2 rounded-xl bg-white hover:bg-zinc-100 text-zinc-700 border border-zinc-200"
                    aria-label="Back to inquiries"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[#1faa6e] shadow-xs">
                    <Shield className="w-5 h-5 text-[#1faa6e]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-zinc-900 tracking-tight">
                        {activeTicket.subject}
                      </h2>
                      {getStatusBadge(activeTicket.status)}
                    </div>
                    <p className="text-xs text-zinc-600 font-medium mt-0.5 flex items-center gap-2">
                      <span className="text-emerald-800 font-bold">{activeTicket.category}</span>
                      <span>•</span>
                      <span className="font-mono text-zinc-500 font-semibold">#{activeTicket.id.slice(0, 8).toUpperCase()}</span>
                      {activeTicket.assigned_agent && (
                        <>
                          <span>•</span>
                          <span className="text-zinc-700 font-semibold">Agent: {activeTicket.assigned_agent}</span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {locked ? (
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-500 bg-zinc-100 px-3 py-1.5 rounded-xl border border-zinc-200">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Conversation Ended</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                    <span>Active</span>
                  </div>
                )}
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-h-[460px] bg-zinc-50/60">
                {loadingActiveTicket ? (
                  <div className="py-20 flex flex-col items-center justify-center text-zinc-600 gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-[#1faa6e]" />
                    <span className="text-sm font-semibold text-zinc-800">Loading...</span>
                  </div>
                ) : (
                  <>
                    {/* Security Notice Pill */}
                    <div className="flex justify-center my-2">
                      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white text-zinc-500 border border-zinc-200 shadow-xs">
                        <ShieldCheck className="w-4 h-4 text-zinc-400 flex-shrink-0" />
                        <span>Messages in this conversation are private and secure.</span>
                      </div>
                    </div>

                    {activeTicket.messages?.map((msg) => {
                      const isUser = msg.sender_type === "user";
                      const isSystem = msg.sender_type === "system";

                      if (isSystem) {
                        return (
                          <div key={msg.id} className="flex justify-center my-3">
                            <div className="max-w-xl w-full bg-zinc-100/90 border border-zinc-200/90 rounded-2xl p-4 shadow-2xs">
                              <div className="flex items-center gap-2 text-zinc-800 font-semibold text-xs mb-1.5">
                                <Landmark className="w-4 h-4 text-zinc-600" />
                                <span>{msg.sender_name}</span>
                                <span className="ml-auto text-[11px] text-zinc-500 font-normal">
                                  {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-700 font-normal leading-relaxed whitespace-pre-wrap">
                                {msg.content}
                              </p>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2.5 ${isUser ? "justify-end" : "justify-start"}`}
                        >
                          {!isUser && (
                            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 flex-shrink-0 text-xs font-bold shadow-xs">
                              {msg.sender_name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </div>
                          )}

                          <div
                            className={`max-w-[85%] sm:max-w-md rounded-2xl px-4 py-3 text-sm shadow-sm ${
                              isUser
                                ? "bg-[#1faa6e] text-white rounded-br-none font-medium"
                                : "bg-white border border-zinc-200 text-zinc-900 rounded-bl-none font-medium"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[11px] font-bold opacity-85 mb-1">
                              <span>{msg.sender_name}</span>
                              <span className="font-semibold">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap text-xs sm:text-sm">
                              {msg.content}
                            </p>
                          </div>

                          {isUser && (
                            <div className="w-8 h-8 rounded-full bg-zinc-200 border border-zinc-300 flex items-center justify-center text-zinc-700 flex-shrink-0 text-xs font-bold shadow-xs">
                              <User className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Chat Input Bar — Locked or Active */}
              {locked ? (
                <div className="p-4 sm:p-5 border-t border-zinc-200 bg-zinc-50">
                  <div className="flex flex-col items-center gap-3 py-3">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <Lock className="w-4.5 h-4.5 text-zinc-400" />
                      <span className="text-sm font-semibold text-zinc-600">This conversation has been closed.</span>
                    </div>
                    <p className="text-xs text-zinc-500 font-medium text-center">
                      If you need further assistance, please open a new support request.
                    </p>
                    <button
                      onClick={() => {
                        setActiveTicket(null);
                        setSelectedDept(null);
                      }}
                      className="mt-1 px-5 py-2.5 rounded-xl bg-[#1faa6e] hover:bg-[#188c5a] text-white font-bold text-sm flex items-center gap-2 transition-all shadow-md"
                    >
                      <Plus className="w-4 h-4" />
                      New Support Request
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-zinc-200 bg-white">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Type a message..."
                      disabled={sendingMsg}
                      className="flex-1 bg-zinc-50 border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 font-medium placeholder:text-zinc-500 focus:outline-none focus:bg-white focus:border-[#1faa6e] focus:ring-2 focus:ring-[#1faa6e]/20 transition-all"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || sendingMsg}
                      className="px-5 py-3 bg-[#1faa6e] hover:bg-[#188c5a] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md flex-shrink-0"
                    >
                      {sendingMsg ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Send</span>
                          <Send className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-400 font-medium mt-2 px-1">
                    <span></span>
                    {activeTicket.assigned_agent ? (
                      <span className="hidden sm:inline font-semibold text-zinc-500">
                        {activeTicket.assigned_agent}
                      </span>
                    ) : null}
                  </div>
                </form>
              )}
            </div>
          ) : (
            /* ── DEPARTMENT CHOOSER & NEW TICKET FORM ── */
            <div className="flex-1 flex flex-col bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm">
              {!selectedDept ? (
                <div>
                  <div className="mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">
                      How can we help?
                    </h2>
                    <p className="text-sm text-zinc-500 font-medium mt-1 leading-relaxed">
                      Select a topic to start a conversation with our support team.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {DEPARTMENTS.map((dept) => {
                      const Icon = dept.icon;
                      return (
                        <button
                          key={dept.id}
                          onClick={() => setSelectedDept(dept)}
                          className="group text-left p-5 rounded-2xl bg-white border-2 border-zinc-200 hover:border-emerald-500 hover:bg-emerald-50/20 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md cursor-pointer"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#1faa6e] group-hover:bg-[#1faa6e] group-hover:text-white transition-colors shadow-xs">
                                <Icon className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300">
                                {dept.badge}
                              </span>
                            </div>
                            <h3 className="text-base font-bold text-zinc-900 group-hover:text-emerald-800 transition-colors">
                              {dept.name}
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-600 font-medium mt-1.5 leading-relaxed">
                              {dept.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-zinc-200 text-xs font-semibold">
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Clock className="w-3.5 h-3.5" /> {dept.typical_response_time}
                            </span>
                            <span className="text-[#1faa6e] font-bold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                              Get help <ChevronRight className="w-4 h-4" />
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Department Selected -> Ticket Details Form */
                <div>
                  <button
                    onClick={() => setSelectedDept(null)}
                    className="flex items-center gap-1.5 text-xs font-bold text-zinc-600 hover:text-zinc-900 transition-colors mb-4"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to All Departments
                  </button>

                  <div className="flex items-center gap-3.5 p-4 rounded-xl bg-emerald-50 border border-emerald-300 mb-6 shadow-xs">
                    <div className="w-11 h-11 rounded-xl bg-[#1faa6e] flex items-center justify-center text-white shadow-xs">
                      <selectedDept.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-zinc-900">{selectedDept.name}</h3>
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                          {selectedDept.badge}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-700 font-medium mt-0.5">
                        {selectedDept.description}
                      </p>
                    </div>
                  </div>

                  {/* Quick Prompt Chips */}
                  <div className="mb-6">
                    <label className="block text-xs font-medium text-zinc-500 mb-2">
                      Common questions
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {selectedDept.promptSuggestions.map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setNewSubject(prompt);
                            setNewMessage(prompt);
                          }}
                          className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-emerald-100 text-zinc-800 hover:text-emerald-900 border border-zinc-300 hover:border-emerald-300 transition-all text-left shadow-2xs"
                        >
                          + {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        Subject
                      </label>
                      <input
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        placeholder="Brief description of your issue"
                        required
                        className="w-full bg-white border border-zinc-300 rounded-xl px-4 py-3 text-sm text-zinc-900 font-medium placeholder:text-zinc-400 focus:outline-none focus:border-[#1faa6e] focus:ring-2 focus:ring-[#1faa6e]/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-700 mb-1.5">
                        How can we help?
                      </label>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Include any relevant details like transaction IDs, dates, or account numbers..."
                        rows={4}
                        required
                        className="w-full bg-white border border-zinc-300 rounded-xl p-4 text-sm text-zinc-900 font-medium placeholder:text-zinc-400 focus:outline-none focus:border-[#1faa6e] focus:ring-2 focus:ring-[#1faa6e]/20 transition-all"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setSelectedDept(null)}
                        className="flex-1 py-3 rounded-xl border border-zinc-300 text-zinc-800 hover:bg-zinc-100 text-sm font-bold transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submittingTicket || !newSubject.trim() || !newMessage.trim()}
                        className="flex-[2] py-3.5 rounded-xl bg-[#1faa6e] hover:bg-[#188c5a] disabled:opacity-50 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
                      >
                        {submittingTicket ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Start Conversation
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
