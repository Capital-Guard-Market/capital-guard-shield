import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TIERS, inr, useSession } from "@/lib/session";

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

function PositionPage() {
  const { position, tier, locked, exitPosition, triggerShield } = useSession();
  const navigate = useNavigate();
  const [ltp, setLtp] = useState(position?.entry ?? 0);

  useEffect(() => {
    if (locked) navigate({ to: "/shield" });
  }, [locked, navigate]);

  useEffect(() => {
    if (!position) return;
    setLtp(position.entry);
    const id = setInterval(() => {
      setLtp((p) => Math.max(1, p + (Math.random() - 0.48) * 4));
    }, 1400);
    return () => clearInterval(id);
  }, [position]);

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
  const pnl = (ltp - position.entry) * position.qty;
  const up = pnl >= 0;

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
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Daily loss limit ({t.name})</span>
          <span className="num font-semibold text-loss">{inr(t.maxLoss)}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-loss transition-all"
            style={{
              width: `${Math.min(100, Math.max(0, (-pnl / t.maxLoss) * 100))}%`,
            }}
          />
        </div>
      </div>

      <button
        onClick={() => {
          exitPosition(pnl);
          navigate({ to: "/terminal" });
        }}
        className="w-full rounded-xl border border-border bg-secondary py-3 text-sm font-semibold transition-colors hover:bg-accent"
      >
        Exit Position
      </button>

      <button
        onClick={() => {
          triggerShield(9000, t.maxLoss);
          navigate({ to: "/shield" });
        }}
        className="w-full rounded-xl bg-loss py-3 text-sm font-semibold text-foreground transition-opacity hover:opacity-90"
      >
        Simulate Loss &amp; Trigger Shield Lockout
      </button>
    </div>
  );
}
