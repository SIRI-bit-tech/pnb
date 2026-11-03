import React, { useState, useEffect } from "react";
import { ExternalLink, TrendingUp, BarChart3, Newspaper, Tag } from "lucide-react";

interface StockDetailsProps {
  ticker: string;
  apiBase: string;
  symbol: string;
}

export default function StockDetails({ ticker, apiBase, symbol }: StockDetailsProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      const token = localStorage.getItem("session_token");
      try {
        const res = await fetch(`${apiBase}/portfolio/stocks/${ticker}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok && isMounted) {
          setDetails(await res.json());
        }
      } catch (err) {
        console.error("Failed to load stock details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (ticker) fetchDetails();
    return () => { isMounted = false; };
  }, [ticker, apiBase]);

  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-50 border border-zinc-100 animate-pulse">
        <div className="h-4 bg-zinc-200 rounded w-1/3" />
        <div className="h-12 bg-zinc-200 rounded w-full" />
      </div>
    );
  }

  if (!details) return null;

  const { metrics, recommendation, news, peers } = details;
  const totalRecs = recommendation ? ((recommendation.buy || 0) + (recommendation.hold || 0) + (recommendation.sell || 0) + (recommendation.strong_buy || 0)) : 0;
  const buyPercent = totalRecs > 0 ? (((recommendation?.buy || 0) + (recommendation?.strong_buy || 0)) / totalRecs) * 100 : 0;
  const holdPercent = totalRecs > 0 ? ((recommendation?.hold || 0) / totalRecs) * 100 : 0;
  const sellPercent = totalRecs > 0 ? ((recommendation?.sell || 0) / totalRecs) * 100 : 0;

  const showMetrics = metrics && ((metrics.market_cap || 0) > 0 || (metrics.pe_ratio || 0) > 0 || (metrics.high_52 || 0) > 0);
  const showRecs = totalRecs > 0;
  const showPeers = peers && peers.length > 0;
  const showNews = news && news.length > 0;

  return (
    <div className="flex flex-col gap-4 border-t border-zinc-150 pt-4 mt-1 text-xs">
      {/* 1. Key Metrics Grid */}
      {showMetrics && (
        <div className="flex flex-col gap-2">
          <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 uppercase tracking-wider text-[9px] text-zinc-500">
            <BarChart3 className="w-3.5 h-3.5 text-zinc-400" /> Key Statistics
          </h5>
          <div className="grid grid-cols-2 gap-2 text-zinc-650 font-medium">
            {(metrics?.market_cap || 0) > 0 && (
              <div className="p-2 bg-zinc-50/50 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-[9px] text-zinc-400">Market Cap</span>
                <span className="font-bold text-zinc-800 font-mono">
                  {(metrics?.market_cap || 0) >= 1000 ? `${((metrics?.market_cap || 0) / 1000).toFixed(2)}B` : `${(metrics?.market_cap || 0).toFixed(2)}M`}
                </span>
              </div>
            )}
            {(metrics?.pe_ratio || 0) > 0 && (
              <div className="p-2 bg-zinc-50/50 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-[9px] text-zinc-400">P/E Ratio</span>
                <span className="font-bold text-zinc-800 font-mono">{(metrics?.pe_ratio || 0).toFixed(2)}x</span>
              </div>
            )}
            {(metrics?.high_52 || 0) > 0 && (
              <div className="p-2 bg-zinc-50/50 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-[9px] text-zinc-400">52W Range</span>
                <span className="font-bold text-zinc-850 font-mono text-[10px] truncate">
                  {symbol}{(metrics?.low_52 || 0).toFixed(1)} - {symbol}{(metrics?.high_52 || 0).toFixed(1)}
                </span>
              </div>
            )}
            {(metrics?.dividend_yield || 0) > 0 && (
              <div className="p-2 bg-zinc-50/50 rounded-xl border border-zinc-100 flex flex-col">
                <span className="text-[9px] text-zinc-400">Div Yield</span>
                <span className="font-bold text-zinc-800 font-mono">{((metrics?.dividend_yield || 0) * 100).toFixed(2)}%</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Analyst Consensus Progress Bar */}
      {showRecs && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 uppercase tracking-wider text-[9px] text-zinc-500">
              <TrendingUp className="w-3.5 h-3.5 text-zinc-400" /> Analyst Consensus
            </h5>
            <span className="text-[10px] font-bold text-emerald-600 font-mono">{buyPercent.toFixed(0)}% Buy</span>
          </div>
          <div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden flex">
            <div style={{ width: `${buyPercent}%` }} className="bg-emerald-500 h-full" title="Buy" />
            <div style={{ width: `${holdPercent}%` }} className="bg-amber-400 h-full" title="Hold" />
            <div style={{ width: `${sellPercent}%` }} className="bg-red-500 h-full" title="Sell" />
          </div>
        </div>
      )}

      {/* 3. Similar Peers */}
      {showPeers && (
        <div className="flex flex-col gap-1.5">
          <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 uppercase tracking-wider text-[9px] text-zinc-500">
            <Tag className="w-3.5 h-3.5 text-zinc-400" /> Similar Assets
          </h5>
          <div className="flex flex-wrap gap-1.5">
            {peers.map((peer: string) => (
              <span key={peer} className="px-2 py-0.5 rounded-lg bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-700 font-mono">
                {peer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Latest News Feed */}
      {showNews && (
        <div className="flex flex-col gap-2">
          <h5 className="font-bold text-zinc-800 flex items-center gap-1.5 uppercase tracking-wider text-[9px] text-zinc-500">
            <Newspaper className="w-3.5 h-3.5 text-zinc-400" /> Recent Market News
          </h5>
          <div className="flex flex-col gap-2">
            {news.map((item: any, idx: number) => (
              <a
                key={idx}
                href={item.url || "#"}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-zinc-50/70 border border-zinc-100 hover:bg-zinc-100/80 transition-colors flex flex-col gap-1 group text-left"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold text-primary">{item.source || "Market News"}</span>
                  <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600" />
                </div>
                <p className="font-semibold text-zinc-800 text-[11px] leading-tight line-clamp-1">{item.headline}</p>
                {item.summary && <p className="text-[10px] text-zinc-500 line-clamp-2 leading-relaxed">{item.summary}</p>}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
