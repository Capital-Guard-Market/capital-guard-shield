import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/watchlist")({
  head: () => ({
    meta: [
      { title: "Watchlist — CapitalGuard" },
      {
        name: "description",
        content: "Simulated index and equity quotes you are tracking before taking a trade.",
      },
      { property: "og:title", content: "Watchlist — CapitalGuard" },
      {
        property: "og:description",
        content: "Live simulated quotes for indices and large caps.",
      },
    ],
  }),
  component: Watchlist,
});

const ITEMS = [
  { sym: "NIFTY 50", ltp: 24780.35, chg: 0.42 },
  { sym: "BANKNIFTY", ltp: 55210.8, chg: -0.31 },
  { sym: "RELIANCE", ltp: 1412.6, chg: 1.18 },
  { sym: "HDFCBANK", ltp: 1976.05, chg: -0.64 },
  { sym: "INFY", ltp: 1543.9, chg: 0.27 },
  { sym: "TATAMOTORS", ltp: 712.45, chg: 2.06 },
];

function Watchlist() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Watchlist</h1>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {ITEMS.map((i) => (
          <div
            key={i.sym}
            className="flex items-center justify-between border-b border-border px-5 py-4 last:border-0"
          >
            <span className="text-sm font-semibold">{i.sym}</span>
            <div className="text-right">
              <p className="num text-sm font-semibold">{i.ltp.toFixed(2)}</p>
              <p className={`num text-xs ${i.chg >= 0 ? "text-profit" : "text-loss"}`}>
                {i.chg >= 0 ? "+" : ""}
                {i.chg.toFixed(2)}%
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
