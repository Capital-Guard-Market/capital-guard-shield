export interface SegmentRiskProfile {
  capital: number;           // Dynamic rolling base capital
  tier1Pct: number;          // 5% Caution tier
  tier2Pct: number;          // 10% Restricted tier
  tier3Pct: number;          // 20% Hard Floor
  maxDailyLoss: number;      // Configurable daily limit (Max 20%)
  currentDrawdown: number;   // Realized + Unrealized Loss today
  isBreached: boolean;       // Kill-switch trigger state
}

export interface GuardrailState {
  isLocked: boolean;
  lockedDate: string | null;
  expiresAt: string | null;
  activeSegment: "FUTURES" | "OPTIONS";
  futures: SegmentRiskProfile;
  options: SegmentRiskProfile;
}

const STORAGE_KEY = "capitalguard_rolling_store_v1";

export function getTodayISTDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function getNextMidnightIST(): string {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(23, 59, 59, 999);
  return midnight.toISOString();
}

export const INITIAL_GUARDRAIL_STATE: GuardrailState = {
  isLocked: false,
  lockedDate: null,
  expiresAt: null,
  activeSegment: "FUTURES",
  futures: {
    capital: 5000000,
    tier1Pct: 5,
    tier2Pct: 10,
    tier3Pct: 20,
    maxDailyLoss: 1000000,
    currentDrawdown: 0,
    isBreached: false,
  },
  options: {
    capital: 1000000,
    tier1Pct: 5,
    tier2Pct: 10,
    tier3Pct: 20,
    maxDailyLoss: 200000,
    currentDrawdown: 0,
    isBreached: false,
  },
};

export function loadGuardrailState(): GuardrailState {
  if (typeof window === "undefined") return INITIAL_GUARDRAIL_STATE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_GUARDRAIL_STATE;

    const state: GuardrailState = JSON.parse(raw);
    const today = getTodayISTDate();

    // Midnight rollover check
    if (state.lockedDate && state.lockedDate !== today) {
      const rolledFuturesCapital = Math.max(100000, state.futures.capital - state.futures.currentDrawdown);
      const rolledOptionsCapital = Math.max(50000, state.options.capital - state.options.currentDrawdown);

      const rolledState: GuardrailState = {
        isLocked: false,
        lockedDate: null,
        expiresAt: null,
        activeSegment: "FUTURES",
        futures: {
          capital: rolledFuturesCapital,
          tier1Pct: 5,
          tier2Pct: 10,
          tier3Pct: 20,
          maxDailyLoss: Math.round(rolledFuturesCapital * 0.20),
          currentDrawdown: 0,
          isBreached: false,
        },
        options: {
          capital: rolledOptionsCapital,
          tier1Pct: 5,
          tier2Pct: 10,
          tier3Pct: 20,
          maxDailyLoss: Math.round(rolledOptionsCapital * 0.20),
          currentDrawdown: 0,
          isBreached: false,
        },
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(rolledState));
      return rolledState;
    }

    return state;
  } catch {
    return INITIAL_GUARDRAIL_STATE;
  }
}

export function saveGuardrailState(state: GuardrailState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}