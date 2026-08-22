import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { ARENAS, inr, useSession, type ArenaId } from "@/lib/session";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [
      { title: "Choose Your Arena — CapitalGuard" },
      {
        name: "description",
        content: "Pick the Options Arena or Futures Arena and get a virtual balance to trade.",
      },
      { property: "og:title", content: "Choose Your Arena — CapitalGuard" },
      {
        property: "og:description",
        content: "Options Arena ₹10,00,000 or Futures Arena ₹50,00,000 virtual capital.",
      },
    ],
  }),
  component: ArenaPage,
});

function ArenaPage() {
  const { setArena } = useSession();
  const navigate = useNavigate();

  const pick = (id: ArenaId) => {
    setArena(id);
    navigate({ to: "/risk-gate" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/broker"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 2 of 4</p>
          <h1 className="text-2xl font-semibold tracking-tight">Choose Arena</h1>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">Pick which arena to trade in.</p>

      <div className="space-y-4">
        {Object.values(ARENAS).map((a) => (
          <button
            key={a.id}
            onClick={() => pick(a.id)}
            className="w-full rounded-2xl border border-border bg-card p-5 text-left transition-colors hover:border-primary/60"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold">{a.name}</h2>
              <span className="num text-lg font-bold text-primary">{inr(a.balance)}</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{a.blurb}</p>
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Zero cross-contamination: Profit/loss in one arena never touches the other.
      </p>
    </div>
  );
}
