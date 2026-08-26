export type ProductType = "MIS" | "NRML";

export interface OpenPosition {
  id: string;
  symbol: string;
  segment: "FUTURES" | "OPTIONS";
  side: "BUY" | "SELL";
  productType: ProductType;
  lots: number;
  qty: number;
  entryPrice: number;
  currentPrice: number;
  slPrice: number;
  pnl: number;
  timestamp: string;
  optionType?: "CE" | "PE";
  strike?: number;
}

export interface ClosedPosition {
  id: string;
  symbol: string;
  segment: "FUTURES" | "OPTIONS";
  side: "BUY" | "SELL";
  productType: ProductType;
  qty: number;
  entryPrice: number;
  exitPrice: number;
  realizedPnL: number;
  closedAt: string;
}

export interface SegmentRisk {
  capital: number;           // Dynamic rolling base capital
  selectedTierPct: number;   // 5, 10, or 20
  selectedFloor: number;     // Chosen daily loss floor in ₹
  realizedPnL: number;       // Today's closed trades PnL
}

export interface GuardrailState {
  isLocked: boolean;
  lockedDate: string | null;
  futures: SegmentRisk;
  options: SegmentRisk;
  positions: OpenPosition[];
  closedPositionsToday: ClosedPosition[];
}

const STORAGE_KEY = "capitalguard_store_v5";

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
    selectedTierPct: 10,
    selectedFloor: 500000,
    realizedPnL: 0,
  },
  options: {
    capital: 1000000,
    selectedTierPct: 10,
    selectedFloor: 100000,
    realizedPnL: 0,
  },
  positions: [],
  closedPositionsToday: [],
};

export function loadGuardrailState(): GuardrailState {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const state: GuardrailState = JSON.parse(raw);
    const today = getTodayISTDate();

    // Midnight Rollover (Passed 12:00 AM IST)
    if (state.lockedDate && state.lockedDate !== today) {
      // 1. Calculate new rolling capital
      const newFuturesCap = Math.max(100000, state.futures.capital + state.futures.realizedPnL);
      const newOptionsCap = Math.max(50000, state.options.capital + state.options.realizedPnL);

      // 2. Retain ONLY NRML (Carry Forward) open positions; auto-drop MIS
      const retainedPositions = (state.positions || []).filter(
        (p) => p.productType === "NRML"
      );

      const rolled: GuardrailState = {
        isLocked: false,
        lockedDate: null,
        futures: {
          capital: newFuturesCap,
          selectedTierPct: 10,
          selectedFloor: Math.round(newFuturesCap * 0.10),
          realizedPnL: 0,
        },
        options: {
          capital: newOptionsCap,
          selectedTierPct: 10,
          selectedFloor: Math.round(newOptionsCap * 0.10),
          realizedPnL: 0,
        },
        positions: retainedPositions,
        closedPositionsToday: [], // Clear yesterday's closed trades
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