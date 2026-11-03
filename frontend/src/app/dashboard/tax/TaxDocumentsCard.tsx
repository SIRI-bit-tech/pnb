import React from "react";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { TaxDocument } from "./types";
import { toast } from "sonner";

interface TaxDocumentsCardProps {
  documents: TaxDocument[];
  symbol: string;
}

export default function TaxDocumentsCard({ documents, symbol }: TaxDocumentsCardProps) {
  const handleDownload = (doc: TaxDocument) => {
    toast.success(`Downloading ${doc.document_type} (${doc.tax_year}) tax form PDF...`);
  };

  return (
    <div className="p-6 rounded-3xl bg-white border border-zinc-200 shadow-sm flex flex-col gap-5 mb-8">
      <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
        <div>
          <h4 className="font-heading font-bold text-zinc-900 text-sm flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Official Annual Tax Documents (1099 & 1098)
          </h4>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Auto-calculated IRS tax statements for reporting annual interest, dividends, stock sales, and loan payments.
          </p>
        </div>
        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          Tax Year 2025 Ready
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-5 rounded-2xl bg-zinc-50/70 border border-zinc-150 flex flex-col justify-between gap-4 hover:border-zinc-300 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                  {doc.document_type.slice(0, 4)}
                </div>
                <div>
                  <span className="font-bold text-xs text-zinc-900 block">
                    Form {doc.document_type}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    Year {doc.tax_year}
                  </span>
                </div>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>

            <p className="text-[11px] text-zinc-600 leading-snug">
              {doc.description}
            </p>

            <div className="flex items-center justify-between border-t border-zinc-200/60 pt-3">
              <div>
                <span className="text-[9px] text-zinc-400 font-semibold uppercase block">Reported Amount</span>
                <span className="font-mono font-bold text-xs text-zinc-900">
                  {symbol}{doc.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>

              <button
                onClick={() => handleDownload(doc)}
                className="px-3 py-1.5 rounded-lg bg-white border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <Download className="w-3 h-3 text-primary" /> PDF
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
