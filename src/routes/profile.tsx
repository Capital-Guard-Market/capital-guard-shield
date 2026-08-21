import { createFileRoute } from "@tanstack/react-router";
import { Ghost } from "lucide-react";
import { ARENAS, TIERS, inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile & Ghost Debt Ledger — CapitalGuard" },
      {
        name: "description",
        content:
          "Track Ghost Debt from margin breaches and watch it shrink with disciplined profitable days.",
      },
      { property: "og:title", content: "Profile & Ghost Debt Ledger — CapitalGuard" },
      {
        property: "og:description",
        content: "Your discipline scorecard: ghost debt, realized P&L and session settings.",
      },
    ],
  }),
  component: Profile,
});

const LEDGER = [
  { date: "20 Aug", note: "Margin breach — 3 lots over limit", delta: 420000 },
  { date: "19 Aug", note: "Disciplined green day", delta: -85000 },
  { date: "18 Aug", note: "Averaged into a loser", delta: 260000 },
  { date: "16 Aug", note: "Exited at plan target", delta: -60000 },
];

function Profile() {
  const { ghostDebt, realized, arena, tier, locked, resetSession } = useSession();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Profile</h1>

      <div className="rounded-2xl border border-loss/40 bg-card p-6">
        <div className="flex items-center gap-2">
          <Ghost className="size-5 text-loss" />
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ghost Debt</p>
        </div>
        <p className="num mt-2 text-4xl font-bold text-loss">{inr(ghostDebt)}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Grows from margin breaches, shrinks with disciplined profitable days.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Realized P&amp;L</p>
          <p
            className={`num mt-1 text-xl font-bold ${realized >= 0 ? "text-profit" : "text-loss"}`}
          >
            {inr(realized, { sign: true })}
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Session</p>
          <p className="mt-1 text-sm font-semibold">
            {arena ? ARENAS[arena].name : "Not started"}
          </p>
          <p className="text-xs text-muted-foreground">
            {tier ? `${TIERS[tier].name} · ${inr(TIERS[tier].maxLoss)}` : "No tier locked"}
            {locked ? " · Shield active" : ""}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <p className="border-b border-border px-5 py-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Ghost Debt ledger
        </p>
        {LEDGER.map((l) => (
          <div
            key={l.date}
            className="flex items-center justify-between border-b border-border px-5 py-3 last:border-0"
          >
            <div>
              <p className="num text-sm font-semibold">{l.date}</p>
              <p className="text-xs text-muted-foreground">{l.note}</p>
            </div>
            <span className={`num text-sm font-semibold ${l.delta > 0 ? "text-loss" : "text-profit"}`}>
              {l.delta > 0 ? "+" : "-"}
              {inr(Math.abs(l.delta))}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={resetSession}
        className="w-full rounded-xl border border-border bg-secondary py-3 text-sm font-semibold transition-colors hover:bg-accent"
      >
        Reset demo session
      </button>
    </div>
  );
}
