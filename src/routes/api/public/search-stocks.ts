import { json } from "@tanstack/start";
import { createAPIFileRoute } from "@tanstack/start/api";

export interface MasterStockItem {
  id: string;
  symbol: string;
  name: string;
  token: string;
  exchange: "NSE" | "BSE";
  segment: string;
  defaultPrice: number;
}

// In-Memory Global Cache for Angel One Scrip Master
let cachedEquityList: MasterStockItem[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 1000 * 60 * 60 * 12; // 12 Hours cache

async function getMasterEquityList(): Promise<MasterStockItem[]> {
  const now = Date.now();
  if (cachedEquityList && now - lastFetchTime < CACHE_DURATION_MS) {
    return cachedEquityList;
  }

  try {
    const res = await fetch(
      "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json"
    );
    if (!res.ok) throw new Error("Failed to fetch Angel One master database");

    const rawData = await res.json();

    // Filter only Cash Equity instruments from NSE and BSE
    const filtered: MasterStockItem[] = rawData
      .filter((item: any) => {
        const isNseEq = item.exch_seg === "NSE" && (item.symbol?.endsWith("-EQ") || item.instrumenttype === "");
        const isBseEq = item.exch_seg === "BSE" && item.instrumenttype === "";
        return isNseEq || isBseEq;
      })
      .map((item: any) => ({
        id: `${item.exch_seg}_${item.token}`,
        symbol: item.name || item.symbol.replace("-EQ", ""),
        name: item.formatted_name || item.name || item.symbol,
        token: item.token,
        exchange: item.exch_seg as "NSE" | "BSE",
        segment: item.exch_seg,
        defaultPrice: 100.0,
      }));

    cachedEquityList = filtered;
    lastFetchTime = now;
    return filtered;
  } catch (err) {
    console.error("Error loading scrip master:", err);
    return [];
  }
}

export const Route = createAPIFileRoute("/api/public/search-stocks")({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") || "").trim().toLowerCase();
    const exchangeFilter = url.searchParams.get("exchange") || "ALL";

    if (!query || query.length < 2) {
      return json({ results: [] });
    }

    const masterList = await getMasterEquityList();

    const exactMatches: MasterStockItem[] = [];
    const partialMatches: MasterStockItem[] = [];

    for (const item of masterList) {
      if (exchangeFilter !== "ALL" && item.exchange !== exchangeFilter) continue;

      const sym = item.symbol.toLowerCase();
      const nm = item.name.toLowerCase();

      if (sym.startsWith(query)) {
        exactMatches.push(item);
      } else if (sym.includes(query) || nm.includes(query)) {
        partialMatches.push(item);
      }

      if (exactMatches.length >= 15) break;
    }

    const combined = [...exactMatches, ...partialMatches].slice(0, 20);

    return json({ results: combined });
  },
});