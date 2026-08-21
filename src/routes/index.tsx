import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, ShieldHalf, TrendingUp } from "lucide-react";
import { useSession, inr } from "@/lib/session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CapitalGuard Terminal — Pick Your Mode" },
      {
        name: "description",
        content:
          "Choose equity investing or F&O simulation. Daily risk gates and shield lockouts keep your virtual capital honest.",
      },
      { property: "og:title", content: "CapitalGuard Terminal — Pick Your Mode" },
      {
        property: "og:description",
        content: "Discipline-first trading simulator with mandatory daily risk limits.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { locked, ghostDebt } = useSession();

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-semibold tracking-tight">CapitalGuard</h1>
        <p className="mt-1 text-sm text-muted-foreground">What are you here to do today?</p>
      </section>

      {locked && (
        <Link
          to="/shield"
          className="block rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm text-primary"
        >
          Shield is active for today — tap to view lockout
        </Link>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          to="/equity"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
        >
          <TrendingUp className="size-6 text-primary" />
          <h2 className="mt-4 text-lg font-semibold">Equity Investments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The pure watchlist experience — track stocks from the moment you get interested, see
            exactly what they&apos;ve done since.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
            Open watchlist <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>

        <Link
          to="/arena"
          className="group rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
        >
          <ShieldHalf className="size-6 text-warning" />
          <h2 className="mt-4 text-lg font-semibold">F&amp;O Trading</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Practice options &amp; futures with real consequences. Wallets, Daily Risk Gate, live
            terminal, and discipline mechanics.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
            Choose arena{" "}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        You can switch between Equity and F&amp;O anytime from your top navigation / profile.
      </p>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ghost Debt</p>
        <p className="num mt-1 text-2xl font-bold text-loss">{inr(ghostDebt)}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Grows from margin breaches, shrinks with disciplined profitable days.
        </p>
      </div>
    </div>
  );
}
