"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  Plane, 
  Calendar, 
  CheckCircle2, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Building2,
  Tag
} from "lucide-react";
import { getApiBase } from "@/lib/api";
import { toast } from "sonner";

interface GenerateAirlineBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialUserId?: string;
  usersList?: any[];
}

interface AirlinePreset {
  id: string;
  name: string;
  code: string;
  country: string;
  defaultRoute: string;
  defaultBank: string;
  pnrPrefix: string;
  typicalFare: string;
}

const AIRLINE_PRESETS: AirlinePreset[] = [
  {
    id: "delta",
    name: "Delta Air Lines",
    code: "DL",
    country: "USA",
    defaultRoute: "JFK → LHR (London Heathrow)",
    defaultBank: "Amex Merchant Services / Delta Air Lines Inc.",
    pnrPrefix: "DL",
    typicalFare: "1485.50"
  },
  {
    id: "united",
    name: "United Airlines",
    code: "UA",
    country: "USA",
    defaultRoute: "EWR → FRA (Frankfurt)",
    defaultBank: "Chase Paymentech / United Airlines Inc.",
    pnrPrefix: "UA",
    typicalFare: "1350.00"
  },
  {
    id: "american",
    name: "American Airlines",
    code: "AA",
    country: "USA",
    defaultRoute: "MIA → MAD (Madrid Barajas)",
    defaultBank: "Bank of America Merchant / American Airlines",
    pnrPrefix: "AA",
    typicalFare: "1280.00"
  },
  {
    id: "emirates",
    name: "Emirates Airlines",
    code: "EK",
    country: "UAE",
    defaultRoute: "JFK → DXB (Dubai International)",
    defaultBank: "Emirates NBD / Emirates Flight Ticketing",
    pnrPrefix: "EK",
    typicalFare: "2150.00"
  },
  {
    id: "qatar",
    name: "Qatar Airways",
    code: "QR",
    country: "Qatar",
    defaultRoute: "DOH → LHR (London Heathrow)",
    defaultBank: "Qatar National Bank / Qatar Airways Group",
    pnrPrefix: "QR",
    typicalFare: "2280.00"
  },
  {
    id: "british",
    name: "British Airways",
    code: "BA",
    country: "UK",
    defaultRoute: "LHR → JFK (New York)",
    defaultBank: "Barclays Merchant / British Airways PLC",
    pnrPrefix: "BA",
    typicalFare: "1620.00"
  },
  {
    id: "singapore",
    name: "Singapore Airlines",
    code: "SQ",
    country: "Singapore",
    defaultRoute: "SIN → NRT (Tokyo Narita)",
    defaultBank: "DBS Bank / Singapore Airlines Ltd.",
    pnrPrefix: "SQ",
    typicalFare: "1890.00"
  },
  {
    id: "airfrance",
    name: "Air France",
    code: "AF",
    country: "France",
    defaultRoute: "CDG → JFK (New York)",
    defaultBank: "BNP Paribas / Air France-KLM Ticketing",
    pnrPrefix: "AF",
    typicalFare: "1420.00"
  },
  {
    id: "lufthansa",
    name: "Lufthansa",
    code: "LH",
    country: "Germany",
    defaultRoute: "FRA → ORD (Chicago O'Hare)",
    defaultBank: "Deutsche Bank / Lufthansa German Airlines",
    pnrPrefix: "LH",
    typicalFare: "1550.00"
  },
  {
    id: "turkish",
    name: "Turkish Airlines",
    code: "TK",
    country: "Turkey",
    defaultRoute: "IST → JFK (New York)",
    defaultBank: "Garanti BBVA / Turkish Airlines E-Ticket",
    pnrPrefix: "TK",
    typicalFare: "1190.00"
  },
  {
    id: "southwest",
    name: "Southwest Airlines",
    code: "WN",
    country: "USA",
    defaultRoute: "DAL → LAS (Las Vegas)",
    defaultBank: "Southwest Airlines Direct Debit Merchant",
    pnrPrefix: "WN",
    typicalFare: "420.00"
  },
  {
    id: "virgin",
    name: "Virgin Atlantic",
    code: "VS",
    country: "UK",
    defaultRoute: "LHR → MIA (Miami)",
    defaultBank: "Virgin Atlantic Airways Flight Settlement",
    pnrPrefix: "VS",
    typicalFare: "1740.00"
  },
  {
    id: "klm",
    name: "KLM Royal Dutch Airlines",
    code: "KL",
    country: "Netherlands",
    defaultRoute: "AMS → DTW (Detroit)",
    defaultBank: "ING Bank / KLM Royal Dutch Airlines",
    pnrPrefix: "KL",
    typicalFare: "1490.00"
  },
  {
    id: "expedia",
    name: "Expedia Flights",
    code: "EX",
    country: "Travel OTA",
    defaultRoute: "ORD → LAX (Los Angeles)",
    defaultBank: "Expedia Group Travel Booking Gateway",
    pnrPrefix: "EX",
    typicalFare: "860.00"
  },
  {
    id: "booking",
    name: "Booking.com Flights",
    code: "BK",
    country: "Travel OTA",
    defaultRoute: "JFK → CDG (Paris Charles de Gaulle)",
    defaultBank: "Booking Holdings Air Travel Settlement",
    pnrPrefix: "BK",
    typicalFare: "1120.00"
  }
];

const CABIN_CLASSES = [
  "Economy Class",
  "Premium Economy",
  "Business Class",
  "First Class"
];

function generateRandomPNR(prefix: string) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${code}`;
}

export default function GenerateAirlineBookingModal({
  isOpen,
  onClose,
  onSuccess,
  initialUserId,
  usersList
}: GenerateAirlineBookingModalProps) {
  const [users, setUsers] = useState<any[]>(usersList || []);
  const [selectedUserId, setSelectedUserId] = useState<string>(initialUserId || "");
  const [selectedAirlineId, setSelectedAirlineId] = useState<string>("delta");
  const [airlineName, setAirlineName] = useState<string>("Delta Air Lines");
  const [amount, setAmount] = useState<string>("1485.50");
  const [bookingRef, setBookingRef] = useState<string>("DL-8K9W");
  const [ticketNumber, setTicketNumber] = useState<string>("006-2491820491");
  const [flightRoute, setFlightRoute] = useState<string>("JFK → LHR (London Heathrow)");
  const [cabinClass, setCabinClass] = useState<string>("Business Class");
  const [passengerName, setPassengerName] = useState<string>("");
  const [dateStr, setDateStr] = useState<string>(() => {
    const now = new Date();
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  });
  const [status, setStatus] = useState<string>("completed");
  const [bankProcessor, setBankProcessor] = useState<string>("Amex Merchant Services / Delta Air Lines Inc.");
  const [customMemo, setCustomMemo] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [successResult, setSuccessResult] = useState<any | null>(null);

  // Sync initial user
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId);
    }
  }, [initialUserId]);

  // Fetch users if not passed
  useEffect(() => {
    if (isOpen && (!users || users.length === 0)) {
      const fetchUsers = async () => {
        const token = localStorage.getItem("admin_session_token");
        if (!token) return;
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/admin/users?page_size=100`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setUsers(data);
            if (!selectedUserId && data.length > 0) {
              setSelectedUserId(data[0].id);
              setPassengerName(data[0].full_name || "");
            }
          }
        } catch (e) {
          console.error("Failed to load users for airline booking modal", e);
        }
      };
      fetchUsers();
    }
  }, [isOpen, users, selectedUserId]);

  // Update passenger name when user changes
  useEffect(() => {
    if (selectedUserId && users.length > 0) {
      const u = users.find(x => x.id === selectedUserId);
      if (u) {
        setPassengerName(u.full_name || "");
      }
    }
  }, [selectedUserId, users]);

  // Handle preset selection
  const handleSelectAirline = (presetId: string) => {
    setSelectedAirlineId(presetId);
    if (presetId === "custom") {
      setAirlineName("");
      setFlightRoute("");
      setBankProcessor("Global Air Transport Merchant Processing");
      setBookingRef(generateRandomPNR("TKT"));
      return;
    }
    const found = AIRLINE_PRESETS.find(p => p.id === presetId);
    if (found) {
      setAirlineName(found.name);
      setFlightRoute(found.defaultRoute);
      setBankProcessor(found.defaultBank);
      setAmount(found.typicalFare);
      const newPnr = generateRandomPNR(found.pnrPrefix);
      setBookingRef(newPnr);
      setTicketNumber(`0${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}`);
    }
  };

  const handleRegeneratePNR = () => {
    const found = AIRLINE_PRESETS.find(p => p.id === selectedAirlineId);
    const prefix = found ? found.pnrPrefix : "TKT";
    setBookingRef(generateRandomPNR(prefix));
    setTicketNumber(`0${Math.floor(Math.random() * 90 + 10)}-${Math.floor(Math.random() * 900000000 + 100000000)}`);
  };

  const applyDatePreset = (preset: "now" | "yesterday" | "7d" | "30d" | "aug2026") => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const format = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T14:30`;

    const d = new Date();
    if (preset === "now") {
      const now = new Date();
      setDateStr(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`);
    } else if (preset === "yesterday") {
      d.setDate(d.getDate() - 1);
      setDateStr(format(d));
    } else if (preset === "7d") {
      d.setDate(d.getDate() - 7);
      setDateStr(format(d));
    } else if (preset === "30d") {
      d.setDate(d.getDate() - 30);
      setDateStr(format(d));
    } else if (preset === "aug2026") {
      setDateStr("2026-08-12T14:30");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) {
      toast.error("Please select a target user.");
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid flight booking amount.");
      return;
    }

    if (!airlineName.trim()) {
      toast.error("Please specify an airline name.");
      return;
    }

    setLoading(true);
    const token = localStorage.getItem("admin_session_token");
    const apiBase = getApiBase();

    try {
      const payload = {
        user_id: selectedUserId,
        airline_name: airlineName.trim(),
        amount: parsedAmount,
        booking_reference: bookingRef.trim(),
        ticket_number: ticketNumber.trim(),
        flight_route: flightRoute.trim(),
        cabin_class: cabinClass,
        passenger_name: passengerName.trim(),
        date: dateStr,
        status: status,
        bank_or_processor: bankProcessor.trim(),
        memo: customMemo.trim() || undefined
      };

      const res = await fetch(`${apiBase}/admin/transactions/airline-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSuccessResult(data);
        toast.success(`Airline booking created for ${airlineName}!`);
        if (onSuccess) onSuccess();
      } else {
        const err = await res.json();
        toast.error(err.detail || "Failed to create airline booking transaction.");
      }
    } catch (err: any) {
      toast.error(err.message || "Network error submitting booking.");
    } finally {
      setLoading(false);
    }
  };

  const selectedUserObj = users.find(u => u.id === selectedUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-zinc-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-950">Generate Airline Booking</h2>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                  Zero Balance Impact
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Create an authentic flight booking transaction record for user history & statements.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-sm text-zinc-700">
          
          {successResult ? (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Airline Booking Generated!</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                  The flight booking has been committed to the ledger. It will appear on the user's transaction history, PDF statements, and receipts with zero balance change.
                </p>
              </div>

              <div className="bg-zinc-50 rounded-2xl border border-zinc-200 p-4 max-w-md mx-auto text-left space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Airline:</span>
                  <span className="font-bold text-zinc-900">{successResult.airline}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Amount:</span>
                  <span className="font-bold text-emerald-600">${parseFloat(successResult.amount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">PNR / Ref:</span>
                  <span className="text-zinc-900 font-bold">{successResult.booking_reference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Transaction ID:</span>
                  <span className="text-zinc-600 truncate w-40" title={successResult.transaction_id}>{successResult.transaction_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Timestamp:</span>
                  <span className="text-zinc-600">{new Date(successResult.created_at).toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={() => setSuccessResult(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                >
                  Generate Another Booking
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Notice Banner */}
              <div className="rounded-2xl bg-sky-50/80 border border-sky-100 p-3.5 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-900">
                  <span className="font-semibold">Safe Ledger Insertion: </span>
                  This generates a fully verifiable airline booking debit in the ledger for statements and receipts. The user's account balance <strong>will not be deducted</strong>.
                </div>
              </div>

              {/* 1. Target User */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Target Account / User
                </label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                >
                  <option value="" disabled>Select Target Account</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name || u.email} ({u.username ? `@${u.username}` : u.email}) — Balance: ${parseFloat(u.account?.balance || "0").toFixed(2)}
                    </option>
                  ))}
                </select>
                {selectedUserObj && (
                  <p className="text-[11px] text-zinc-500">
                    Account: <span className="font-mono text-zinc-700">{selectedUserObj.account?.account_number || "Default Checking"}</span> | Currency: <span className="font-bold text-zinc-700">{selectedUserObj.account?.currency || "USD"}</span>
                  </p>
                )}
              </div>

              {/* 2. Top Airline Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Airline / Booking Platform</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Choose from top airlines or enter custom</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto p-1 border border-zinc-100 rounded-2xl bg-zinc-50/50">
                  {AIRLINE_PRESETS.map((p) => {
                    const isSelected = selectedAirlineId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleSelectAirline(p.id)}
                        className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? "bg-white border-sky-500 text-sky-900 shadow-sm ring-1 ring-sky-500/30"
                            : "bg-white/80 border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700">
                            {p.code}
                          </span>
                          <span className="text-[9px] text-zinc-400">{p.country}</span>
                        </div>
                        <span className="font-bold text-[11px] truncate mt-1">{p.name}</span>
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => handleSelectAirline("custom")}
                    className={`p-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between cursor-pointer ${
                      selectedAirlineId === "custom"
                        ? "bg-white border-sky-500 text-sky-900 shadow-sm ring-1 ring-sky-500/30"
                        : "bg-white/80 border-zinc-200/80 text-zinc-600 hover:border-zinc-300 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                        CUSTOM
                      </span>
                    </div>
                    <span className="font-bold text-[11px] mt-1">Other Platform</span>
                  </button>
                </div>
              </div>

              {/* Airline Name & Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Airline / Merchant Name
                  </label>
                  <input
                    type="text"
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    placeholder="e.g. Delta Air Lines Inc."
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Amount Paid</span>
                    <span className="text-[10px] text-zinc-400 font-normal">In Account Currency</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-zinc-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="1485.50"
                      className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Flight Route & Cabin Class */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Flight Route / Description
                  </label>
                  <input
                    type="text"
                    value={flightRoute}
                    onChange={(e) => setFlightRoute(e.target.value)}
                    placeholder="e.g. JFK → LHR Roundtrip"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Cabin Class
                  </label>
                  <select
                    value={cabinClass}
                    onChange={(e) => setCabinClass(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-medium text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    {CABIN_CLASSES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Booking Reference (PNR) & E-Ticket # */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                    <span>PNR / Booking Reference</span>
                    <button
                      type="button"
                      onClick={handleRegeneratePNR}
                      className="text-[10px] text-sky-600 hover:text-sky-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Auto-Generate
                    </button>
                  </label>
                  <input
                    type="text"
                    value={bookingRef}
                    onChange={(e) => setBookingRef(e.target.value)}
                    placeholder="e.g. DL-8K9W"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono font-bold text-zinc-900 uppercase focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    E-Ticket / Confirmation #
                  </label>
                  <input
                    type="text"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value)}
                    placeholder="e.g. 006-2491820491"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-900 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Date & Backdating Presets */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-zinc-400" />
                    Transaction Date & Time
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="text-zinc-400">Quick:</span>
                    <button type="button" onClick={() => applyDatePreset("now")} className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 cursor-pointer">Now</button>
                    <button type="button" onClick={() => applyDatePreset("yesterday")} className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 cursor-pointer">Yesterday</button>
                    <button type="button" onClick={() => applyDatePreset("7d")} className="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 text-zinc-600 cursor-pointer">-7 Days</button>
                    <button type="button" onClick={() => applyDatePreset("aug2026")} className="px-1.5 py-0.5 rounded bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold cursor-pointer">Aug 12, 2026</button>
                  </div>
                </div>
                <input
                  type="datetime-local"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-mono text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  required
                />
              </div>

              {/* Status and Merchant Clearing Network */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Transaction Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-800 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  >
                    <option value="completed">Completed (Settled)</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Clearing Bank / Network
                  </label>
                  <input
                    type="text"
                    value={bankProcessor}
                    onChange={(e) => setBankProcessor(e.target.value)}
                    placeholder="Merchant Settlement Bank"
                    className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Optional Custom Memo Override */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
                  <span>Custom Statement Memo (Optional)</span>
                  <span className="text-[10px] text-zinc-400 font-normal">Leave blank to auto-format</span>
                </label>
                <input
                  type="text"
                  value={customMemo}
                  onChange={(e) => setCustomMemo(e.target.value)}
                  placeholder={`Preview: ${airlineName}: Flight ${flightRoute} (${cabinClass}) | PNR: ${bookingRef}`}
                  className="w-full px-3.5 py-2 rounded-xl border border-zinc-200 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Booking...</span>
                    </>
                  ) : (
                    <>
                      <Plane className="w-4 h-4" />
                      <span>Generate Airline Booking</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
}
