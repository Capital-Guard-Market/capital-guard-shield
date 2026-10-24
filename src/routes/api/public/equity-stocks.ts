import { createFileRoute } from "@tanstack/react-router";

const INSTRUMENT_MASTER_URL =
  "https://margincalculator.angelbroking.com/OpenAPI_File/files/OpenAPIScripMaster.json";
const CATALOG_CACHE_MS = 6 * 60 * 60 * 1000;

type Instrument = {
  token?: string;
  symbol?: string;
  name?: string;
  exch_seg?: string;
  instrumenttype?: string;
};

type EquityStock = {
  id: string;
  symbol: string;
  name: string;
  token: string;
  exchange: "NSE" | "BSE";
};

let catalogCache: { stocks: EquityStock[]; expiresAt: number } | undefined;
let catalogPromise: Promise<EquityStock[]> | undefined;

async function loadEquityCatalog(): Promise<EquityStock[]> {
  if (catalogCache && catalogCache.expiresAt > Date.now()) return catalogCache.stocks;
  if (catalogPromise) return catalogPromise;

  catalogPromise = (async () => {
    const response = await fetch(INSTRUMENT_MASTER_URL, { signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`Instrument master request failed (${response.status}).`);

    const instruments = (await response.json()) as Instrument[];
    if (!Array.isArray(instruments)) throw new Error("Instrument master response was invalid.");

    const stocks = instruments.flatMap((instrument): EquityStock[] => {
      const exchange = instrument.exch_seg;
      const token = instrument.token?.trim();
      const rawSymbol = instrument.symbol?.trim();
      if (
        (exchange !== "NSE" && exchange !== "BSE") ||
        !token ||
        !/^\d+$/.test(token) ||
        !rawSymbol ||
        instrument.instrumenttype?.trim()
      ) {
        return [];
      }

      const symbol = exchange === "NSE" ? rawSymbol.replace(/-EQ$/, "") : rawSymbol;
      if (!symbol) return [];

      return [{
        id: `${exchange}_${token}`,
        symbol,
        name: instrument.name?.trim() || symbol,
        token,
        exchange,
      }];
    });

    stocks.sort((left, right) => left.symbol.localeCompare(right.symbol) || left.exchange.localeCompare(right.exchange));
    catalogCache = { stocks, expiresAt: Date.now() + CATALOG_CACHE_MS };
    return stocks;
  })().finally(() => {
    catalogPromise = undefined;
  });

  return catalogPromise;
}

export const Route = createFileRoute("/api/public/equity-stocks")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const stocks = await loadEquityCatalog();
          return Response.json(
            { status: "OK", stocks },
            { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=86400" } },
          );
        } catch (error) {
          console.error("equity catalog error", error);
          return Response.json(
            { status: "UPSTREAM_ERROR", message: "Stock catalog is temporarily unavailable.", stocks: [] },
            { status: 502, headers: { "cache-control": "no-store" } },
          );
        }
      },
    },
  },
});