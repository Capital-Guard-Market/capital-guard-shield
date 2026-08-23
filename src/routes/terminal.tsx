import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Minus, Plus, ShieldCheck, X } from "lucide-react";
import { TIERS, inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/terminal")({
  head: () => ({
    meta: [
      { title: "Live F&O Terminal — CapitalGuard" },
      {
        name: "description",
        content: "NIFTY option chain simulation with live LTPs, order tickets and risk tracking.",
      },
      { property: "og:title", content: "Live F&O Terminal — CapitalGuard" },
      {
        property: "og:description",
        content: "Trade the simulated NIFTY option chain under your locked daily loss limit.",
      },
    ],
  }),
  component: Terminal,
});

const SPOT = 24780.35;
const LOT = 65;
const CHAIN = [
  { strike: 24600, ce: 243.5, pe: 48.2 },
  { strike: 24700, ce: 172.8, pe: 71.6 },
  { strike: 24800, ce: 121.9, pe: 118.4 },
  { strike: 24900, ce: 82.35, pe: 178.9 },
  { strike: 25000, ce: 54.1, pe: 249.7 },
];

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-secondary"
      }`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${
          on ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Ticket({
  strike,
  type,
  ltp,
  onClose,
}: {
  strike: number;
  type: "CE" | "PE";
  ltp: number;
  onClose: () => void;
}) {
  const { openPosition } = useSession();
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [limitPrice, setLimitPrice] = useState(ltp.toFixed(2));
  const [lots, setLots] = useState(1);
  const [slOn, setSlOn] = useState(true);
  const [sl, setSl] = useState((ltp * 0.85).toFixed(2));
  const [tgtOn, setTgtOn] = useState(true);
  const [tgt, setTgt] = useState((ltp * 1.25).toFixed(2));

  const qty = lots * LOT;
  const entry = orderType === "LIMIT" ? Number(limitPrice) || ltp : ltp;
  const slVal = slOn ? Number(sl) || 0 : null;
  const tgtVal = tgtOn ? Number(tgt) || 0 : null;
  const maxRisk = slVal ? Math.max(0, (entry - slVal) * qty) : null;
  const reward = tgtVal ? Math.max(0, (tgtVal - entry) * qty) : null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              NIFTY {strike.toLocaleString("en-IN")} {type}
            </h2>
            <p className="text-xs text-muted-foreground">28 AUG EXPIRY</p>
          </div>
          <button onClick={onClose} aria-label="Close ticket">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <p className="num mt-3 text-2xl font-bold text-primary">₹{ltp.toFixed(2)}</p>

        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary p-1">
          {(["MARKET", "LIMIT"] as const).map((o) => (
            <button
              key={o}
              onClick={() => setOrderType(o)}
              className={`rounded-lg py-2 text-xs font-semibold uppercase tracking-wider transition-colors ${
                orderType === o ? "bg-primary text-background" : "text-muted-foreground"
              }`}
            >
              {o}
            </button>
          ))}
        </div>

        {orderType === "LIMIT" && (
          <label className="mt-3 block">
            <span className="text-xs text-muted-foreground">Entry price</span>
            <input
              type="number"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              className="num mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        )}

        <div className="mt-4 flex items-center justify-between rounded-xl border border-border px-3 py-2">
          <div>
            <p className="text-xs text-muted-foreground">Quantity</p>
            <p className="num text-sm font-semibold">
              {qty} qty · {lots} lot{lots > 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLots((l) => Math.max(1, l - 1))}
              aria-label="Decrease lots"
              className="flex size-8 items-center justify-center rounded-lg border border-border"
            >
              <Minus className="size-4" />
            </button>
            <button
              onClick={() => setLots((l) => l + 1)}
              aria-label="Increase lots"
              className="flex size-8 items-center justify-center rounded-lg border border-border"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 space-y-3 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Stop-loss</span>
            <Toggle on={slOn} onChange={setSlOn} />
          </div>
          {slOn && (
            <input
              type="number"
              value={sl}
              onChange={(e) => setSl(e.target.value)}
              aria-label="Stop-loss price"
              className="num w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-loss"
            />
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm">Target</span>
            <Toggle on={tgtOn} onChange={setTgtOn} />
          </div>
          {tgtOn && (
            <input
              type="number"
              value={tgt}
              onChange={(e) => setTgt(e.target.value)}
              aria-label="Target price"
              className="num w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-profit"
            />
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-loss/40 bg-loss/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Max risk</p>
            <p className="num text-sm font-bold text-loss">
              {maxRisk === null ? "Unlimited" : inr(maxRisk)}
            </p>
          </div>
          <div className="rounded-xl border border-profit/40 bg-profit/10 p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Potential reward
            </p>
            <p className="num text-sm font-bold text-profit">
              {reward === null ? "Open" : inr(reward)}
            </p>
          </div>
        </div>

        <p className="num mt-3 text-xs text-muted-foreground">
          Margin required {inr(qty * entry)}
        </p>

        <button
          onClick={() => {
            openPosition({
              symbol: "NIFTY",
              strike,
              type,
              side: "BUY",
              qty,
              entry,
              sl: slVal,
              target: tgtVal,
            });
            navigate({ to: "/position" });
          }}
          className="mt-5 w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90"
        >
          Execute order
        </button>
      </div>
    </div>
  );
}

function Terminal() {
  const { tier, locked, maxLoss, balance, availableMargin, realized } = useSession();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<{ strike: number; type: "CE" | "PE" } | null>(null);
  const [spot, setSpot] = useState(SPOT);

  useEffect(() => {
    if (locked) navigate({ to: "/shield" });
  }, [locked, navigate]);

  useEffect(() => {
    const id = setInterval(() => setSpot((s) => s + (Math.random() - 0.5) * 6), 1600);
    return () => clearInterval(id);
  }, []);

  if (locked) return null;

  if (!tier) {
    return (
      <div className="rounded-2xl border border-warning/40 bg-warning/10 p-5">
        <p className="text-sm text-warning">
          You must clear the Daily Risk Gate before the terminal unlocks.
        </p>
        <Link to="/risk-gate" className="mt-3 inline-block text-sm font-semibold text-primary">
          Go to risk gate →
        </Link>
      </div>
    );
  }

  const t = TIERS[tier];
  const chg = (((spot - 24677.2) / 24677.2) * 100).toFixed(2);
  const lossUsed = Math.max(0, -realized);
  const row = selected ? CHAIN.find((c) => c.strike === selected.strike) : undefined;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">NIFTY</p>
            <p className="num text-3xl font-bold">{spot.toFixed(2)}</p>
          </div>
          <span className="num rounded-lg bg-profit/15 px-2 py-1 text-sm font-semibold text-profit">
            +{chg}%
          </span>
        </div>
        <p className="num mt-2 text-xs text-muted-foreground">28 AUG EXPIRY</p>
      </div>

      <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-baseline justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Available margin
            </p>
            <p className="num text-lg font-bold">
              {inr(availableMargin)}{" "}
              <span className="text-xs font-normal text-muted-foreground">/ {inr(balance)}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              Daily realized P&amp;L
            </p>
            <p
              className={`num text-lg font-bold ${realized >= 0 ? "text-profit" : "text-loss"}`}
            >
              {inr(realized, { sign: true })}
            </p>
          </div>
        </div>

        <div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Daily loss limit used</span>
            <span className="num">
              {inr(lossUsed)} / {inr(maxLoss)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-loss transition-all"
              style={{ width: `${Math.min(100, (lossUsed / maxLoss) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
        <ShieldCheck className="size-4 text-primary" />
        <span className="text-primary">
          {t.name} · max daily loss <span className="num font-semibold">{inr(maxLoss)}</span>
        </span>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="num grid grid-cols-3 border-b border-border px-4 py-2 text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>CE LTP</span>
          <span className="text-center">Strike</span>
          <span className="text-right">PE LTP</span>
        </div>
        {CHAIN.map((c) => {
          const atm = c.strike === 24800;
          return (
            <div
              key={c.strike}
              className={`num grid w-full grid-cols-3 items-center text-sm ${
                atm ? "bg-primary/5" : ""
              }`}
            >
              <button
                onClick={() => setSelected({ strike: c.strike, type: "CE" })}
                className="px-4 py-3 text-left font-semibold text-profit transition-colors hover:bg-accent"
              >
                {c.ce.toFixed(2)}
              </button>
              <span className="text-center font-semibold">
                {c.strike}
                {atm && (
                  <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                    ATM
                  </span>
                )}
              </span>
              <button
                onClick={() => setSelected({ strike: c.strike, type: "PE" })}
                className="px-4 py-3 text-right font-semibold text-loss transition-colors hover:bg-accent"
              >
                {c.pe.toFixed(2)}
              </button>
            </div>
          );
        })}
      </div>

      {row && selected && (
        <Ticket
          strike={row.strike}
          type={selected.type}
          ltp={selected.type === "CE" ? row.ce : row.pe}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
