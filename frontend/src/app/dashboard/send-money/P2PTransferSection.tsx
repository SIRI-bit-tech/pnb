"use client";

import React from "react";
import { Search, X, CheckCircle2 } from "lucide-react";
import { P2PTransferSectionProps } from "./types";

export default function P2PTransferSection({
  username,
  setUsername,
  searchResults,
  setSearchResults,
  selectedUser,
  setSelectedUser
}: P2PTransferSectionProps) {
  return (
    <div className="bg-white border border-zinc-200/80 rounded-3xl p-6 shadow-sm flex flex-col gap-5">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
        Select Recipient
      </span>

      {selectedUser ? (
        <div className="border border-primary bg-primary/5 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {selectedUser.full_name.slice(0, 2)}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold text-zinc-950">{selectedUser.full_name}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold">@{selectedUser.username}</span>
            </div>
          </div>
          
          <button 
            onClick={() => {
              setSelectedUser(null);
              setUsername("");
            }}
            className="text-zinc-400 hover:text-zinc-700 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Search by username..." 
            className="w-full pl-9 pr-3 py-3 text-xs bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:border-primary focus:bg-white"
          />

          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1.5 bg-white border border-zinc-200 rounded-xl shadow-lg z-50 overflow-hidden divide-y divide-zinc-100">
              {searchResults.map((u) => (
                <button
                  key={u.username}
                  onClick={() => {
                    setSelectedUser(u);
                    setSearchResults([]);
                  }}
                  className="w-full px-4 py-3 text-left hover:bg-zinc-50 flex flex-col"
                >
                  <span className="text-xs font-bold text-zinc-950">{u.full_name}</span>
                  <span className="text-[10px] text-zinc-400">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!selectedUser && (
        <div>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-3">
            Frequent
          </span>
          <div className="flex gap-4">
            <button 
              onClick={() => setSelectedUser({ username: "james_miller", full_name: "James Miller" } as any)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-600 group-hover:border-primary">
                JM
              </div>
              <span className="text-[9px] text-zinc-500 font-bold group-hover:text-zinc-800">James M.</span>
            </button>
            <button 
              onClick={() => setSelectedUser({ username: "david_chen", full_name: "David Chen" } as any)}
              className="flex flex-col items-center gap-1.5 group cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full border border-zinc-200 bg-zinc-50 flex items-center justify-center text-xs font-bold text-zinc-600 group-hover:border-primary">
                DC
              </div>
              <span className="text-[9px] text-zinc-500 font-bold group-hover:text-zinc-800">David C.</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
