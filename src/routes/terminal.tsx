import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck, X } from "lucide-react";
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
const CHAIN = [
  { strike: 24600, ce: 243.5, pe: 48.2 },
  { strike: 24700, ce: 172.8, pe: 71.6 },
  { strike: 24800, ce: 121.9, pe: 118.4 },
  { strike: 24900, ce: 82.35, pe: 178.9 },
  { strike: 25000, ce: 54.1, pe: 249.7 },
];

function Ticket({
  strike,
  ltp,
  onClose,
}: {
  strike: number;
  ltp: number;
  onClose: () => void;
}) {
  const { openPosition } = useSession();
  const navigate = useNavigate();
  const qty = 65;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-background/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              NIFTY {strike} CE
            </h2>
            <p className="text-xs text-muted-foreground">28 AUG EXPIRY · Market order</p>
          </div>
          <button onClick={onClose} aria-label="Close ticket">
            <X className="size-5 text-muted-foreground" />
          </button>
        </div>

        <dl className="mt-5 space-y-3 text-sm">
          {[
            ["LTP", `₹${ltp.toFixed(2)}`],
            ["Quantity", `${qty} (1 lot)`],
            ["Margin required", inr(qty * ltp)],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="num font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        <button
          onClick={() => {
            openPosition({
              symbol: "NIFTY",
              strike,
              type: "CE",
              side: "BUY",
              qty,
              entry: ltp,
            });
            navigate({ to: "/position" });
          }}
          className="mt-6 w-full rounded-xl bg-profit py-3 text-sm font-semibold text-background transition-opacity hover:opacity-90"
        >
          BUY {strike} CE
        </button>
      </div>
    </div>
  );
}

function Terminal() {
  const { tier, locked } = useSession();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number | null>(null);
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
  const row = CHAIN.find((c) => c.strike === selected);

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

      <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm">
        <ShieldCheck className="size-4 text-primary" />
        <span className="text-primary">
          {t.name} · max daily loss <span className="num font-semibold">{inr(t.maxLoss)}</span>
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
            <button
              key={c.strike}
              onClick={() => setSelected(c.strike)}
              className={`num grid w-full grid-cols-3 items-center px-4 py-3 text-sm transition-colors hover:bg-accent ${
                atm ? "bg-primary/5" : ""
              }`}
            >
              <span className="text-left font-semibold text-profit">{c.ce.toFixed(2)}</span>
              <span className="text-center font-semibold">
                {c.strike}
                {atm && (
                  <span className="ml-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                    ATM
                  </span>
                )}
              </span>
              <span className="text-right font-semibold text-loss">{c.pe.toFixed(2)}</span>
            </button>
          );
        })}
      </div>

      {row && (
        <Ticket strike={row.strike} ltp={row.ce} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
