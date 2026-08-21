import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Lock } from "lucide-react";
import { ARENAS, TIERS, inr, useSession, type TierId } from "@/lib/session";

export const Route = createFileRoute("/risk-gate")({
  head: () => ({
    meta: [
      { title: "Daily Risk Gate — CapitalGuard" },
      {
        name: "description",
        content:
          "Lock a max daily loss tier before trading: Conservative, Balanced or Aggressive.",
      },
      { property: "og:title", content: "Daily Risk Gate — CapitalGuard" },
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

  const pick = (id: TierId) => {
    setTier(id);
    navigate({ to: "/terminal" });
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 2 of 3</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Daily risk gate</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {arenaInfo.name} · Balance <span className="num">{inr(arenaInfo.balance)}</span>. Your
          tier locks for the whole session.
        </p>
      </div>

      <div className="space-y-4">
        {Object.values(TIERS).map((t) => {
          const active = tier === t.id;
          return (
            <button
              key={t.id}
              onClick={() => pick(t.id)}
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

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Lock className="size-3.5" /> Once selected, the tier cannot be raised until tomorrow.
      </p>
    </div>
  );
}
