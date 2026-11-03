import React from "react";
import { ShieldAlert, Info } from "lucide-react";
import { toast } from "sonner";

interface AccountPermissionsProps {
  marginEnabled: boolean;
  setMarginEnabled: (val: boolean) => void;
  shortEnabled: boolean;
  setShortEnabled: (val: boolean) => void;
}

export default function AccountPermissions({
  marginEnabled,
  setMarginEnabled,
  shortEnabled,
  setShortEnabled,
}: AccountPermissionsProps) {
  const toggleMargin = () => {
    const val = !marginEnabled;
    setMarginEnabled(val);
    localStorage.setItem("pt_invest_margin_enabled", val.toString());
    toast.success(`Margin capability ${val ? "enabled" : "disabled"} successfully!`);
  };

  const toggleShort = () => {
    const val = !shortEnabled;
    setShortEnabled(val);
    localStorage.setItem("pt_invest_short_enabled", val.toString());
    toast.success(`Short-selling capability ${val ? "enabled" : "disabled"} successfully!`);
  };

  return (
    <div className="rounded-3xl border border-zinc-200/90 bg-white p-5 shadow-sm mt-6">
      <h3 className="font-heading font-bold text-zinc-900 text-sm mb-4 flex items-center gap-1.5">
        <ShieldAlert className="w-4 h-4 text-amber-500" /> Account Level Permissions
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-zinc-100">
        <div className="flex flex-col gap-3 pt-4 md:pt-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-850">Enable Margin Account (2x leverage)</p>
              <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5 leading-relaxed">
                Borrow funds against your current cash collateral to double your buying power. Margin accounts carry interest charges of 4.5% APR on utilized debt.
              </p>
            </div>
            <button
              onClick={toggleMargin}
              className={`w-11 h-6 rounded-full transition-colors relative outline-none flex items-center cursor-pointer ${
                marginEnabled ? "bg-primary" : "bg-zinc-200"
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                marginEnabled ? "right-1" : "left-1"
              }`} />
            </button>
          </div>
          {marginEnabled && (
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-150 flex items-center justify-between text-[10px] font-medium text-zinc-650">
              <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-zinc-400" /> Current Leverage Ratio</span>
              <span className="font-mono text-zinc-800">2.0x (Double buying power)</span>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-6 md:pt-0 md:pl-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-zinc-850">Enable Short-Selling</p>
              <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5 leading-relaxed">
                Sell borrowed shares to profit from declining market values. Requires 150% margin maintenance collateral. Short-selling has unlimited downside risk.
              </p>
            </div>
            <button
              onClick={toggleShort}
              className={`w-11 h-6 rounded-full transition-colors relative outline-none flex items-center cursor-pointer ${
                shortEnabled ? "bg-primary" : "bg-zinc-200"
              }`}
            >
              <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                shortEnabled ? "right-1" : "left-1"
              }`} />
            </button>
          </div>
          {shortEnabled && (
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-150 flex items-center justify-between text-[10px] font-medium text-zinc-650">
              <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-zinc-400" /> Maintenance Margin Req.</span>
              <span className="font-mono text-zinc-800">150.0% (Risk collateral lock)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
