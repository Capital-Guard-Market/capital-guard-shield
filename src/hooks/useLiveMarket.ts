import { useEffect, useRef, useState } from "react";

export type LiveQuote = {
  symbol: string;
  ltp: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  close: number;
};

export type LiveMarketFeed = {
  status: "IDLE" | "LIVE_CONNECTED" | "FALLBACK_OFFLINE" | "AUTH_FAILED" | "NO_DATA" | "SERVER_ERROR";
  message?: string | undefined;
  quotes: LiveQuote[];
  bySymbol: Record<string, LiveQuote>;
  isLive: boolean;
  updatedAt: string | null;
};

const ENDPOINT = "/api/public/market-feed";

/** Polls the Angel One SmartAPI bridge every `intervalMs` (default 2s). */
export function useLiveMarket(intervalMs = 2000): LiveMarketFeed {
  const [feed, setFeed] = useState<LiveMarketFeed>({
    status: "IDLE",
    quotes: [],
    bySymbol: {},
    isLive: false,
    updatedAt: null,
  });
  const inFlight = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const tick = async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const res = await fetch(ENDPOINT, { headers: { accept: "application/json" } });
        const json = (await res.json()) as {
          status: LiveMarketFeed["status"];
          message?: string;
          timestamp?: string;
          quotes?: LiveQuote[];
        };
        if (cancelled) return;
        const quotes = json.quotes ?? [];
        setFeed({
          status: json.status,
          message: json.message,
          quotes,
          bySymbol: Object.fromEntries(quotes.map((q) => [q.symbol, q])),
          isLive: json.status === "LIVE_CONNECTED",
          updatedAt: json.timestamp ?? new Date().toISOString(),
        });
      } catch {
        if (!cancelled) {
          setFeed((prev) => ({ ...prev, status: "SERVER_ERROR", isLive: false }));
        }
      } finally {
        inFlight.current = false;
      }
    };

    void tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  return feed;
}
