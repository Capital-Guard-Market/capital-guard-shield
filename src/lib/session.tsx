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
  { id: TierId; name: string; pct: number; maxLoss: number; note: string }
> = {
  conservative: {
    id: "conservative",
    name: "Conservative",
    pct: 5,
    maxLoss: 5000,
    note: "Shield triggers fast. Best for rebuilding discipline.",
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    pct: 10,
    maxLoss: 10000,
    note: "Room for two bad trades before the day ends.",
  },
  aggressive: {
    id: "aggressive",
    name: "Aggressive",
    pct: 20,
    maxLoss: 20000,
    note: "High rope. Ghost Debt grows faster on breaches.",
  },
};

export type Position = {
  symbol: string;
  strike: number;
  type: "CE" | "PE";
  side: "BUY" | "SELL";
  qty: number;
  entry: number;
};

type SessionState = {
  arena: ArenaId | null;
  tier: TierId | null;
  position: Position | null;
  locked: boolean;
  capitalSaved: number;
  realized: number;
  ghostDebt: number;
};

const DEFAULT: SessionState = {
  arena: null,
  tier: null,
  position: null,
  locked: false,
  capitalSaved: 0,
  realized: 0,
  ghostDebt: 3850000,
};

const KEY = "capitalguard.session.v1";

type Ctx = SessionState & {
  setArena: (a: ArenaId) => void;
  setTier: (t: TierId) => void;
  openPosition: (p: Position) => void;
  exitPosition: (pnl: number) => void;
  triggerShield: (saved: number, loss: number) => void;
  resetSession: () => void;
};

const SessionContext = createContext<Ctx | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(DEFAULT);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
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

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      setArena: (arena) => update({ arena, tier: null, position: null, locked: false }),
      setTier: (tier) => update({ tier }),
      openPosition: (position) => update({ position }),
      exitPosition: (pnl) =>
        update({
          position: null,
          realized: state.realized + pnl,
          ghostDebt: pnl > 0 ? Math.max(0, state.ghostDebt - pnl * 2) : state.ghostDebt,
        }),
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
        setState(DEFAULT);
      },
    }),
    [state, update],
  );

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
