import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 1 of 3</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Choose your arena</h1>
      </div>

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
    </div>
  );
}
