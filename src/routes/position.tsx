import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { TIERS, inr, useSession, type TradeSummary } from "@/lib/session";

export const Route = createFileRoute("/position")({
  head: () => ({
    meta: [
      { title: "Active Position — CapitalGuard" },
      {
        name: "description",
        content: "Watch live P&L on your simulated NIFTY option position and exit on your terms.",
      },
      { property: "og:title", content: "Active Position — CapitalGuard" },
      {
        property: "og:description",
        content: "Live mark-to-market P&L with a hard shield lockout when the limit breaks.",
      },
    ],
  }),
  component: PositionPage,
});

function SummaryModal({ trade, onClose }: { trade: TradeSummary; onClose: () => void }) {
  const win = trade.pnl >= 0;
  const points = trade.exit - trade.entry;
  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Trade Closed</h2>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              win ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss"
            }`}
          >
            {win ? "🟢 PROFIT" : "🔴 LOSS"}
          </span>
        </div>

        <p className={`num mt-5 text-4xl font-bold ${win ? "text-profit" : "text-loss"}`}>
          {inr(trade.pnl, { sign: true })}
        </p>

        <dl className="mt-6 space-y-3 text-sm">
          {[
            ["Instrument", `${trade.symbol} ${trade.strike} ${trade.type}`],
            ["Entry price", `₹${trade.entry.toFixed(2)}`],
            ["Exit price", `₹${trade.exit.toFixed(2)}`],
            ["Points captured", `${points >= 0 ? "+" : ""}${points.toFixed(2)} pts`],
            ["Quantity", `${trade.qty} Qty`],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="num font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90"
        >
          Back to terminal
        </button>
      </div>
    </div>
  );
}

function PositionPage() {
  const { position, tier, locked, maxLoss, realized, closePosition, clearLastTrade } = useSession();
  const navigate = useNavigate();
  const [ltp, setLtp] = useState(position?.entry ?? 0);
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const closing = useRef(false);

  useEffect(() => {
    if (locked && !summary) navigate({ to: "/shield" });
  }, [locked, summary, navigate]);

  useEffect(() => {
    if (!position) return;
    closing.current = false;
    setLtp(position.entry);
    const id = setInterval(() => {
      setLtp((p) => Math.max(1, p + (Math.random() - 0.48) * 4));
    }, 1400);
    return () => clearInterval(id);
  }, [position]);

  const close = (exitPrice: number, reason: TradeSummary["reason"]) => {
    if (closing.current) return;
    closing.current = true;
    setSummary(closePosition(exitPrice, reason));
  };

  const pnl = position ? (ltp - position.entry) * position.qty : 0;

  // Auto SL / target / shield checks
  useEffect(() => {
    if (!position || closing.current) return;
    if (position.sl !== null && ltp <= position.sl) return close(position.sl, "sl");
    if (position.target !== null && ltp >= position.target) return close(position.target, "target");
    if (realized + pnl <= -maxLoss) close(ltp, "shield");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ltp, position, realized, maxLoss, pnl]);

  if (summary) {
    return (
      <SummaryModal
        trade={summary}
        onClose={() => {
          clearLastTrade();
          setSummary(null);
          navigate({ to: locked ? "/shield" : "/terminal" });
        }}
      />
    );
  }

  if (locked) return null;

  if (!position) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">No open position.</p>
        <Link to="/terminal" className="mt-3 inline-block text-sm font-semibold text-primary">
          Back to terminal →
        </Link>
      </div>
    );
  }

  const t = tier ? TIERS[tier] : TIERS.balanced;
  const up = pnl >= 0;
  const dayLoss = Math.max(0, -(realized + pnl));

  return (
    <div className="space-y-5">
      <div
        className={`rounded-2xl border bg-card p-6 ${up ? "border-profit/40" : "border-loss/40"}`}
      >
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {position.side} · {position.qty} qty · 28 AUG
        </p>
        <h1 className="mt-1 text-xl font-semibold">
          {position.symbol} {position.strike} {position.type}
        </h1>

        <p className={`num mt-5 text-4xl font-bold ${up ? "text-profit" : "text-loss"}`}>
          {inr(pnl, { sign: true, decimals: 0 })}
        </p>
        <p className="num mt-1 text-sm text-muted-foreground">
          LTP ₹{ltp.toFixed(2)} · Entry ₹{position.entry.toFixed(2)}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Stop-loss</p>
            <p className="num font-semibold text-loss">
              {position.sl !== null ? `₹${position.sl.toFixed(2)}` : "Not set"}
            </p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Target</p>
            <p className="num font-semibold text-profit">
              {position.target !== null ? `₹${position.target.toFixed(2)}` : "Not set"}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily loss limit ({t.name})</span>
          <span className="num font-semibold text-loss">
            {inr(dayLoss)} / {inr(maxLoss)}
          </span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-loss transition-all"
            style={{ width: `${Math.min(100, (dayLoss / maxLoss) * 100)}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          Demo testing controls
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
          <button
            onClick={() => setLtp((p) => p + 10)}
            className="rounded-xl border border-profit/40 bg-profit/10 py-2 font-semibold text-profit"
          >
            + ₹10 Ticks
          </button>
          <button
            onClick={() => setLtp((p) => Math.max(0.05, p - 10))}
            className="rounded-xl border border-loss/40 bg-loss/10 py-2 font-semibold text-loss"
          >
            − ₹10 Ticks
          </button>
          <button
            onClick={() => close(position.sl ?? position.entry * 0.85, "sl")}
            className="rounded-xl border border-border bg-secondary py-2 font-semibold"
          >
            ⚡ Trigger Stop-Loss
          </button>
          <button
            onClick={() => close(position.target ?? position.entry * 1.25, "target")}
            className="rounded-xl border border-border bg-secondary py-2 font-semibold"
          >
            🎯 Trigger Target Hit
          </button>
        </div>
      </div>

      <button
        onClick={() => close(ltp, "manual")}
        className="w-full rounded-xl bg-loss py-4 text-sm font-bold uppercase tracking-wider text-foreground transition-opacity hover:opacity-90"
      >
        Exit position now
      </button>
    </div>
  );
}
