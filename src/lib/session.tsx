import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type ArenaId = "options" | "futures";
export type TierId = "conservative" | "balanced" | "aggressive";

export const ARENAS: Record<
  ArenaId,
  { id: ArenaId; name: string; balance: number; blurb: string }
> = {
  options: {
    id: "options",
    name: "Options Arena",
    balance: 1000000,
    blurb: "Weekly index options. Premium decay is brutal — size small.",
  },
  futures: {
    id: "futures",
    name: "Futures Arena",
    balance: 5000000,
    blurb: "Full contract exposure. Every tick is real money in simulation.",
  },
};

export const TIERS: Record<
  TierId,
  { id: TierId; name: string; pct: number; note: string }
> = {
  conservative: {
    id: "conservative",
    name: "Conservative",
    pct: 5,
    note: "Shield triggers fast. Best for rebuilding discipline.",
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    pct: 10,
    note: "Room for two bad trades before the day ends.",
  },
  aggressive: {
    id: "aggressive",
    name: "Aggressive",
    pct: 20,
    note: "High rope. Ghost Debt grows faster on breaches.",
  },
};

/** Rupee ceiling derived from the active arena balance and the chosen tier. */
export function maxLossFor(arena: ArenaId | null, tier: TierId | null) {
  const balance = ARENAS[arena ?? "options"].balance;
  const pct = TIERS[tier ?? "balanced"].pct;
  return Math.round((balance * pct) / 100);
}

export type Position = {
  symbol: string;
  strike: number;
  type: "CE" | "PE";
  side: "BUY" | "SELL";
  qty: number;
  entry: number;
  sl: number | null;
  target: number | null;
};

export type TradeSummary = {
  symbol: string;
  strike: number;
  type: "CE" | "PE";
  qty: number;
  entry: number;
  exit: number;
  pnl: number;
  reason: "manual" | "sl" | "target" | "shield";
};

export type User = { name: string; email: string; avatar: string; method: "google" | "phone" };

type SessionState = {
  user: User | null;
  arena: ArenaId | null;
  tier: TierId | null;
  position: Position | null;
  lastTrade: TradeSummary | null;
  locked: boolean;
  capitalSaved: number;
  realized: number;
  ghostDebt: number;
};

const DEFAULT: SessionState = {
  user: null,
  arena: null,
  tier: null,
  position: null,
  lastTrade: null,
  locked: false,
  capitalSaved: 0,
  realized: 0,
  ghostDebt: 3850000,
};

const KEY = "capitalguard.session.v1";

type Ctx = SessionState & {
  hydrated: boolean;
  maxLoss: number;
  balance: number;
  usedMargin: number;
  availableMargin: number;
  signIn: (u: User) => void;
  signOut: () => void;
  setArena: (a: ArenaId) => void;
  setTier: (t: TierId) => void;
  openPosition: (p: Position) => void;
  closePosition: (exitPrice: number, reason: TradeSummary["reason"]) => TradeSummary;
  clearLastTrade: () => void;
  triggerShield: (saved: number, loss: number) => void;
  resetSession: () => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const update = useCallback((patch: Partial<SessionState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const maxLoss = maxLossFor(state.arena, state.tier);
    const balance = ARENAS[state.arena ?? "options"].balance;
    const usedMargin = state.position ? state.position.qty * state.position.entry : 0;
    const equity = balance + state.realized;

    return {
      ...state,
      hydrated,
      maxLoss,
      balance,
      usedMargin,
      availableMargin: equity - usedMargin,
      signIn: (user) => update({ user }),
      signOut: () => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* ignore */
        }
        setState(DEFAULT);
      },
      setArena: (arena) =>
        update({ arena, tier: null, position: null, locked: false, realized: 0, lastTrade: null }),
      setTier: (tier) => update({ tier }),
      openPosition: (position) => update({ position, lastTrade: null }),
      closePosition: (exitPrice, reason) => {
        const p = state.position;
        const summary: TradeSummary = p
          ? {
              symbol: p.symbol,
              strike: p.strike,
              type: p.type,
              qty: p.qty,
              entry: p.entry,
              exit: exitPrice,
              pnl: (exitPrice - p.entry) * p.qty * (p.side === "SELL" ? -1 : 1),
              reason,
            }
          : {
              symbol: "NIFTY",
              strike: 0,
              type: "CE",
              qty: 0,
              entry: 0,
              exit: exitPrice,
              pnl: 0,
              reason,
            };

        const realized = state.realized + summary.pnl;
        const breached = realized <= -maxLoss;

        update({
          position: null,
          lastTrade: summary,
          realized,
          locked: breached || state.locked,
          capitalSaved: breached ? Math.max(0, balance + realized) : state.capitalSaved,
          ghostDebt: breached
            ? state.ghostDebt + Math.abs(realized) * 3
            : summary.pnl > 0
              ? Math.max(0, state.ghostDebt - summary.pnl * 2)
              : state.ghostDebt,
        });

        return summary;
      },
      clearLastTrade: () => update({ lastTrade: null }),
      triggerShield: (saved, loss) =>
        update({
          locked: true,
          position: null,
          capitalSaved: saved,
          realized: state.realized - loss,
          ghostDebt: state.ghostDebt + loss * 3,
        }),
      resetSession: () => {
        localStorage.removeItem(KEY);
        setState({ ...DEFAULT, user: state.user });
      },
    };
  }, [state, hydrated, update]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}

export function inr(n: number, opts: { sign?: boolean; decimals?: number } = {}) {
  const { sign = false, decimals = 0 } = opts;
  const s = Math.abs(n).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const prefix = n < 0 ? "-₹" : sign ? "+₹" : "₹";
  return `${prefix}${s}`;
}
