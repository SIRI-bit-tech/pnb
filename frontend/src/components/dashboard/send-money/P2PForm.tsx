"use client";

import React, { useState, useEffect, useRef } from "react";
import FormInput from "@/components/FormInput";
import { RecipientUser } from "@/types/transfer";

interface P2PFormProps {
  amount: string;
  setAmount: (amt: string) => void;
  memo: string;
  setMemo: (memo: string) => void;
  selectedUser: RecipientUser | null;
  setSelectedUser: (user: RecipientUser | null) => void;
  onContinue: () => void;
}

export default function P2PForm({
  amount,
  setAmount,
  memo,
  setMemo,
  selectedUser,
  setSelectedUser,
  onContinue,
}: P2PFormProps) {
  const [username, setUsername] = useState("");
  const [searchResults, setSearchResults] = useState<RecipientUser[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (username.length < 2 || selectedUser) {
      setSearchResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const token = localStorage.getItem("session_token");
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
      try {
        const res = await fetch(`${apiBase}/auth/search-users?q=${username}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error("User search failed", err);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, selectedUser]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        {selectedUser ? (
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">{selectedUser.full_name}</p>
              <p className="text-[10px] text-primary-muted">@{selectedUser.username}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-[10px] text-error hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <>
            <FormInput
              label="Recipient Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Type username..."
            />
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-[#0c0f19] border border-white/10 rounded-2xl shadow-xl z-50 overflow-hidden">
                {searchResults.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchResults([]);
                    }}
                    className="w-full px-4 py-3 text-left text-xs text-white hover:bg-white/5 border-b border-white/[0.05] last:border-0"
                  >
                    <p className="font-semibold">{u.full_name}</p>
                    <p className="text-primary-muted">@{u.username}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <FormInput
        label="Amount ($)"
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
      />
      <FormInput
        label="Memo (Optional)"
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
        placeholder="What's this for?"
      />

      <button
        onClick={onContinue}
        disabled={!selectedUser || !amount || parseFloat(amount) <= 0}
        className="w-full py-3 rounded-2xl bg-white text-black font-semibold text-xs hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:pointer-events-none mt-2"
      >
        Continue
      </button>
    </div>
  );
}
