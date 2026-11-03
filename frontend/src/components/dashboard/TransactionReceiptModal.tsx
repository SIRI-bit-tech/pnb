"use client";

import React, { useRef, useState } from "react";
import { X, FileText, Download, CheckCircle2, Clock, AlertCircle, Loader2 } from "lucide-react";

interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any; // Supports both snake_case (API) and camelCase (Types)
  currentUserProfile?: any; // The logged-in user profile
}

export default function TransactionReceiptModal({
  isOpen,
  onClose,
  transaction: tx,
  currentUserProfile: profile,
}: TransactionReceiptModalProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const receiptContentRef = useRef<HTMLDivElement>(null);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!isOpen || !tx) return null;

  // 1. Resolve values supporting snake_case and camelCase
  const direction = (tx.direction || "").toLowerCase();
  const typeLower = (tx.type || "").toLowerCase();
  const status = (tx.status || "completed").toLowerCase();
  const amountVal = Math.abs(Number(tx.amount) || 0);

  const getCurrencySymbol = (curr?: string) => {
    switch ((curr || "").toUpperCase()) {
      case "EUR": return "€";
      case "GBP": return "£";
      case "CAD": return "C$";
      case "AUD": return "A$";
      case "CHF": return "CHF ";
      case "JPY": return "¥";
      case "SGD": return "S$";
      case "AED": return "AED ";
      default: return "$";
    }
  };
  const currencySymbol = getCurrencySymbol(tx.currency);

  const memo = (tx.memo || "").trim();
  const memoLower = memo.toLowerCase();

  const userFullName = profile?.full_name || profile?.fullName || "Account Owner";
  const userAccNum = profile?.account?.account_number || profile?.account?.accountNumber;
  const userAccDisplay = userAccNum ? `Checking (**** ${userAccNum.slice(-4)})` : "Checking Account";

  // Determine if this is an outgoing or incoming transaction for the user
  const isIncoming =
    direction === "credit" ||
    typeLower === "deposit" ||
    typeLower === "credit" ||
    memoLower.includes("loan disbursement") ||
    memoLower.includes("personal loan") ||
    memoLower.includes("tax refund") ||
    memoLower.includes("internal revenue service") ||
    Boolean(profile?.account?.id && tx.to_account_id === profile.account.id && tx.from_account_id !== profile.account.id && !tx.external_account_name);

  const isOutgoing = !isIncoming;

  let senderName = userFullName;
  let senderAccount = userAccDisplay;
  let receiverName = "Merchant / Recipient";
  let receiverAccount = "**** 4821";
  let receiverBank = "Prescott National Bank, N.A.";

  if (isOutgoing) {
    // Current user is SENDING money out
    senderName = userFullName;
    const src = tx.source_account || tx.from_account_type;
    senderAccount = src
      ? `${src.charAt(0).toUpperCase() + src.slice(1).toLowerCase()} (**** ${userAccNum ? userAccNum.slice(-4) : "9116"})`
      : userAccDisplay;

    receiverName =
      tx.external_account_name ||
      tx.externalAccountName ||
      tx.recipient_full_name ||
      tx.recipientFullName ||
      tx.recipient_name ||
      (tx.recipient_username ? `@${tx.recipient_username}` : null) ||
      tx.external_bank_name ||
      "Beneficiary";

    receiverAccount =
      tx.external_account_number ||
      tx.externalAccountNumber ||
      tx.iban_or_account ||
      "**** 4821";

    receiverBank =
      tx.external_bank_name ||
      tx.externalBankName ||
      (typeLower === "wire" ? "International Beneficiary Bank" : "External Financial Institution");
  } else {
    // Current user is RECEIVING money (Deposit / Loan / Refund / Credit)
    if (memoLower.includes("loan disbursement") || memoLower.includes("personal loan")) {
      senderName = "Prescott National Bank Institutional Banking";
      senderAccount = "Treasury Vault #9012";
    } else if (memoLower.includes("irs") || memoLower.includes("tax refund")) {
      senderName = "Internal Revenue Service (US Treasury)";
      senderAccount = "US Treasury Disbursing Office #38102";
    } else {
      senderName =
        tx.sender_full_name ||
        tx.senderFullName ||
        tx.sender_name ||
        (tx.sender_username ? `@${tx.sender_username}` : null) ||
        tx.external_account_name ||
        "External Deposit Sender";
      senderAccount = "Federal Clearing House";
    }

    receiverName = userFullName;
    const dest = tx.destination_account || tx.to_account_type;
    receiverAccount = dest
      ? `${dest.charAt(0).toUpperCase() + dest.slice(1).toLowerCase()} (**** ${userAccNum ? userAccNum.slice(-4) : "9116"})`
      : userAccDisplay;
    receiverBank = "Prescott National Bank, N.A.";
  }

  // 2. Parse Date and Time
  const rawDate = tx.created_at || tx.createdAt || tx.date;
  let displayDate = "Mon Dec 01 2026";
  let displayTime = "12:00:00";
  
  if (rawDate) {
    try {
      const d = new Date(rawDate);
      displayDate = d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "2-digit",
        year: "numeric",
      });
      displayTime = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    } catch {
      // fallback
    }
  }

  // 3. Resolve Status Graphics and Messages
  let StatusIcon = CheckCircle2;
  let iconColor = "text-emerald-500 bg-emerald-50";
  let statusHeadline = "Transfer successful";
  
  if (status === "processing" || status === "pending") {
    StatusIcon = Clock;
    iconColor = "text-amber-500 bg-amber-50";
    statusHeadline = status === "processing" ? "Transfer processing" : "Transfer pending";
  } else if (status === "failed") {
    StatusIcon = AlertCircle;
    iconColor = "text-red-500 bg-red-50";
    statusHeadline = "Transfer failed";
  }

  // 4. Download Receipt as Crisp PNG Image
  const handleDownloadImage = async () => {
    if (!receiptContentRef.current) return;
    setDownloadingImage(true);
    try {
      const { toPng } = await import("html-to-image");
      const refCode = tx.id ? tx.id.toString().replace(/-/g, "").slice(0, 10) : "CW-TX";
      const dataUrl = await toPng(receiptContentRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });
      const link = document.createElement("a");
      link.download = `Receipt_${refCode}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download receipt image:", err);
    } finally {
      setDownloadingImage(false);
    }
  };

  // 5. Download Receipt as Crisp PDF
  const handleDownloadPdf = async () => {
    if (!receiptContentRef.current) return;
    setDownloadingPdf(true);
    try {
      const { toPng } = await import("html-to-image");
      const { default: jsPDF } = await import("jspdf");

      const node = receiptContentRef.current;
      const refCode = tx.id ? tx.id.toString().replace(/-/g, "").slice(0, 10) : "CW-TX";
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#ffffff",
      });

      const width = node.offsetWidth;
      const height = node.offsetHeight;

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: [width, height],
      });

      pdf.addImage(dataUrl, "PNG", 0, 0, width, height);
      pdf.save(`Receipt_${refCode}.pdf`);
    } catch (err) {
      console.error("Failed to download receipt PDF:", err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-md" onClick={onClose} />

      {/* Printable Receipt Panel */}
      <div 
        ref={receiptRef}
        className="relative z-10 w-full max-w-[420px] rounded-3xl border border-zinc-200 bg-white px-6 py-6 shadow-2xl text-zinc-800 printable-receipt my-auto max-h-[90vh] overflow-y-auto flex flex-col"
      >
        {/* Close Button (Hidden when printing or downloading) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 transition-all focus:outline-none print:hidden z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Printable & Downloadable Content Container */}
        <div ref={receiptContentRef} className="bg-white rounded-3xl p-3 -m-3 flex flex-col">
          {/* Status Graphics */}
          <div className="flex flex-col items-center text-center mt-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${iconColor}`}>
              <StatusIcon className="w-6 h-6" />
            </div>
            <h2 className="text-sm font-bold tracking-tight text-zinc-950">{statusHeadline}</h2>
            <p className="text-xs text-zinc-400 font-bold mt-0.5">
              {isOutgoing ? `To ${receiverName}` : `From ${senderName}`}
            </p>
          </div>

          {/* Details Cards */}
          <div className="flex flex-col gap-4 mt-5 flex-1">
            {/* Transaction Details */}
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Transaction details
              </h3>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-3.5 py-3 flex flex-col gap-2.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Date</span>
                  <span className="font-bold text-zinc-800">{displayDate}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Time</span>
                  <span className="font-bold text-zinc-800">{displayTime}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Reference</span>
                  <span className="font-mono text-zinc-700 font-bold text-[10px]">
                    {tx.id ? tx.id.toString().replace(/-/g, "").slice(0, 10) : "CW-TX"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] items-center pt-2 border-t border-zinc-100">
                  <span className="text-zinc-500 font-medium">Amount</span>
                  <span className="font-mono text-xs font-bold text-primary">
                    {currencySymbol}{amountVal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Account Details */}
            <div>
              <h3 className="text-[9px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Account details
              </h3>
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50/50 px-3.5 py-3 flex flex-col gap-2.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Sender name</span>
                  <span className="font-bold text-zinc-800">{senderName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Sender account number</span>
                  <span className="font-bold text-zinc-800">{senderAccount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Receiver name</span>
                  <span className="font-bold text-zinc-800">{receiverName}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Receiver account number</span>
                  <span className="font-bold text-zinc-800 break-all">{receiverAccount}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-zinc-500 font-medium">Receiver bank name</span>
                  <span className="font-bold text-zinc-800">{receiverBank}</span>
                </div>
                {tx.routing_number && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">
                      {typeLower === "wire" ? "SWIFT / BIC" : "Routing number"}
                    </span>
                    <span className="font-mono font-bold text-zinc-800">{tx.routing_number}</span>
                  </div>
                )}
                {tx.fee && Number(tx.fee) > 0 && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">Transfer fee</span>
                    <span className="font-bold text-zinc-800">
                      ${Number(tx.fee).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-[11px] items-start pt-2 border-t border-zinc-100">
                  <span className="text-zinc-500 font-medium">Narration</span>
                  <span className="font-bold text-zinc-800 max-w-[220px] text-right break-words text-[11px]">
                    {memo || (typeLower === "wire" ? "International SWIFT Wire" : "Transfer")}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons (Hidden when printing) */}
        <div className="flex gap-3 mt-6 print:hidden">
          <button
            onClick={handleDownloadImage}
            disabled={downloadingImage || downloadingPdf}
            className="flex-1 py-2.5 px-3 rounded-xl border border-zinc-200 bg-zinc-50 text-[11px] font-bold text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
          >
            {downloadingImage ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5 text-zinc-500" />
                <span>Download Image</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingImage || downloadingPdf}
            className="flex-1 py-2.5 px-3 rounded-xl bg-primary text-white text-[11px] font-bold hover:bg-primary-dark flex items-center justify-center gap-1.5 transition-colors duration-150 disabled:opacity-50 cursor-pointer"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <FileText className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Printable Styles Block */}
      <style jsx global>{`
        @media print {
          /* Hide everything except the receipt modal */
          body * {
            visibility: hidden;
            background: none !important;
          }
          .printable-receipt, .printable-receipt * {
            visibility: visible;
          }
          .printable-receipt {
            position: absolute;
            left: 50% !important;
            top: 50% !important;
            transform: translate(-50%, -50%) !important;
            width: 100% !important;
            max-width: 450px !important;
            border: none !important;
            box-shadow: none !important;
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
