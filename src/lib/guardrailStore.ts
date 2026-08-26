export interface OpenPosition {
  id: string;
  symbol: string;
  segment: "FUTURES" | "OPTIONS";
  side: "BUY" | "SELL";
  lots: number;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  slPrice: number;
  pnl: number;
  timestamp: string;
}

export interface SegmentRisk {
  capital: number;           // Dynamic Rolling Capital
  tier1Limit: number;        // 5% Caution
  tier2Limit: number;        // 10% Restricted
  tier3Limit: number;        // 20% Hard Floor
  realizedPnL: number;       // Today's closed trades PnL
}

export interface GuardrailState {
  isLocked: boolean;
  lockedDate: string | null;
  futures: SegmentRisk;
  options: SegmentRisk;
  positions: OpenPosition[];
}

const STORAGE_KEY = "capitalguard_store_v3";

export function getTodayISTDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export const DEFAULT_STATE: GuardrailState = {
  isLocked: false,
  lockedDate: null,
  futures: {
    capital: 5000000,
    tier1Limit: 250000,  // 5% of 50L
    tier2Limit: 500000,  // 10% of 50L
    tier3Limit: 1000000, // 20% of 50L
    realizedPnL: 0,
  },
  options: {
    capital: 1000000,
    tier1Limit: 50000,   // 5% of 10L
    tier2Limit: 100000,  // 10% of 10L
    tier3Limit: 200000,  // 20% of 10L
    realizedPnL: 0,
  },
  positions: [],
};

export function loadGuardrailState(): GuardrailState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const state: GuardrailState = JSON.parse(raw);
    const today = getTodayISTDate();

    // Midnight Rollover: Apply yesterday's PnL to base capital & reset day counters
    if (state.lockedDate && state.lockedDate !== today) {
      const newFuturesCap = Math.max(100000, state.futures.capital + state.futures.realizedPnL);
      const newOptionsCap = Math.max(50000, state.options.capital + state.options.realizedPnL);

      const rolled: GuardrailState = {
        isLocked: false,
        lockedDate: null,
        futures: {
          capital: newFuturesCap,
          tier1Limit: Math.round(newFuturesCap * 0.05),
          tier2Limit: Math.round(newFuturesCap * 0.10),
          tier3Limit: Math.round(newFuturesCap * 0.20),
          realizedPnL: 0,
        },
        options: {
          capital: newOptionsCap,
          tier1Limit: Math.round(newOptionsCap * 0.05),
          tier2Limit: Math.round(newOptionsCap * 0.10),
          tier3Limit: Math.round(newOptionsCap * 0.20),
          realizedPnL: 0,
        },
        positions: [],
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rolled));
      return rolled;
    }

    return state;
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveGuardrailState(state: GuardrailState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}