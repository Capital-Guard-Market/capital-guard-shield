import { useEffect, useState } from "react";

export type LiveQuote = {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
};

export type LiveMarketFeed = {
  status: "IDLE" | "LIVE_CONNECTED" | "FALLBACK_OFFLINE" | "AUTH_FAILED" | "NO_DATA" | "SERVER_ERROR";
  message?: string;
  quotes: Record<string, any>;
  bySymbol: Record<string, LiveQuote>;
  isLive: boolean;
  updatedAt: string | null;
  lastUpdated: string;
};

export function useLiveMarket() {
  const [feed, setFeed] = useState<LiveMarketFeed>({
    status: "IDLE",
    quotes: {},
    bySymbol: {},
    isLive: false,
    updatedAt: null,
    lastUpdated: "",
  });

  useEffect(() => {
    let isMounted = true;

    const fetchQuotes = async () => {
      try {
        let res = await fetch("/api/market-feed");
        if (!res.ok) {
          res = await fetch("/api/public/market-feed");
        }
        if (!res.ok) return;

        const data = await res.json();

        if (isMounted && (data.status === "LIVE_CONNECTED" || data.quotes)) {
          const rawQuotes = data.quotes || {};
          const bySym: Record<string, LiveQuote> = {};

          Object.entries(rawQuotes).forEach(([sym, val]: [string, any]) => {
            bySym[sym] = {
              symbol: sym,
              ltp: typeof val.ltp === "number" ? val.ltp : Number(val.ltp || 0),
              change: typeof val.change === "number" ? val.change : Number(val.change || 0),
              changePercent: typeof val.percentChange === "number" ? val.percentChange : Number(val.changePercent || val.percentChange || 0),
              open: val.open,
              high: val.high,
              low: val.low,
              close: val.close,
            };
          });

          setFeed({
            status: "LIVE_CONNECTED",
            quotes: rawQuotes,
            bySymbol: bySym,
            isLive: true,
            updatedAt: data.timestamp || new Date().toLocaleTimeString(),
            lastUpdated: data.timestamp || new Date().toLocaleTimeString(),
          });
        }
      } catch (err) {
        console.error("Live market feed error:", err);
      }
    };

    fetchQuotes();
    const interval = setInterval(fetchQuotes, 2000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return {
    ...feed,
    feed,
  };
}
