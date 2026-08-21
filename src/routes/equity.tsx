import { createFileRoute, Link } from "@tanstack/react-router";
import { inr } from "@/lib/session";

export const Route = createFileRoute("/equity")({
  head: () => ({
    meta: [
      { title: "Equity Investments — CapitalGuard" },
      {
        name: "description",
        content: "Track long-horizon stock trajectories in a simulated equity portfolio.",
      },
      { property: "og:title", content: "Equity Investments — CapitalGuard" },
      {
        property: "og:description",
        content: "Positional equity simulation without daily lockouts.",
      },
    ],
  }),
  component: Equity,
});

const HOLDINGS = [
  { sym: "RELIANCE", qty: 40, avg: 1284.2, ltp: 1412.6 },
  { sym: "INFY", qty: 60, avg: 1602.5, ltp: 1543.9 },
  { sym: "HDFCBANK", qty: 25, avg: 1795.0, ltp: 1976.05 },
];

function Equity() {
  const invested = HOLDINGS.reduce((s, h) => s + h.qty * h.avg, 0);
  const current = HOLDINGS.reduce((s, h) => s + h.qty * h.ltp, 0);
  const pnl = current - invested;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Equity investments</h1>

      <div className="rounded-2xl border border-border bg-card p-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Current value</p>
        <p className="num mt-1 text-3xl font-bold">{inr(current)}</p>
        <p className={`num mt-1 text-sm font-semibold ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
          {inr(pnl, { sign: true })} ({((pnl / invested) * 100).toFixed(2)}%)
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {HOLDINGS.map((h) => {
          const p = (h.ltp - h.avg) * h.qty;
          return (
            <div
              key={h.sym}
              className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0"
            >
              <div>
                <p className="text-sm font-semibold">{h.sym}</p>
                <p className="num text-xs text-muted-foreground">
                  {h.qty} qty · avg ₹{h.avg.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <p className="num text-sm font-semibold">₹{h.ltp.toFixed(2)}</p>
                <p className={`num text-xs ${p >= 0 ? "text-profit" : "text-loss"}`}>
                  {inr(p, { sign: true })}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/arena"
        className="block rounded-xl border border-border bg-secondary py-3 text-center text-sm font-semibold transition-colors hover:bg-accent"
      >
        Switch to F&amp;O trading
      </Link>
    </div>
  );
}
