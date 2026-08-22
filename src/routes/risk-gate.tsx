import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";
import { ARENAS, TIERS, inr, useSession, type TierId } from "@/lib/session";

export const Route = createFileRoute("/risk-gate")({
  head: () => ({
    meta: [
      { title: "Today's Guardrail — CapitalGuard" },
      {
        name: "description",
        content:
          "Lock a max daily loss tier before trading: Conservative 5%, Balanced 10% or Aggressive 20%.",
      },
      { property: "og:title", content: "Today's Guardrail — CapitalGuard" },
      {
        property: "og:description",
        content: "Mandatory guardrail: pick your max daily loss before the terminal unlocks.",
      },
    ],
  }),
  component: RiskGate,
});

function RiskGate() {
  const { arena, tier, setTier } = useSession();
  const navigate = useNavigate();
  const arenaInfo = arena ? ARENAS[arena] : ARENAS.options;
  const [picked, setPicked] = useState<TierId | null>(tier);

  const confirm = () => {
    if (!picked) return;
    setTier(picked);
    navigate({ to: "/terminal" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/arena"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 3 of 4</p>
          <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s Guardrail</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {arenaInfo.name} · Balance <span className="num">{inr(arenaInfo.balance)}</span>. Your tier
        locks for the whole session.
      </p>

      <div className="space-y-4">
        {Object.values(TIERS).map((t) => {
          const active = picked === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setPicked(t.id)}
              className={`w-full rounded-2xl border bg-card p-5 text-left transition-colors ${
                active ? "border-primary glow-ring" : "border-border hover:border-primary/60"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <h2 className="text-lg font-semibold">{t.name}</h2>
                <span className="num text-sm text-muted-foreground">{t.pct}% risk</span>
              </div>
              <p className="num mt-1 text-xl font-bold text-loss">
                {inr(t.maxLoss)} <span className="text-xs font-normal">max loss</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{t.note}</p>
            </button>
          );
        })}
      </div>

      <p className="flex items-center gap-2 text-xs text-warning">
        <Lock className="size-3.5" /> Locked for 24 hours once chosen.
      </p>

      <button
        onClick={confirm}
        disabled={!picked}
        className="w-full rounded-xl bg-primary py-4 text-sm font-bold uppercase tracking-wider text-background transition-opacity hover:opacity-90 disabled:opacity-40"
      >
        Confirm guardrail &amp; enter terminal
      </button>
    </div>
  );
}
