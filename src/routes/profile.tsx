import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Ghost, LogOut } from "lucide-react";
import { inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your Profile & Ghost Debt — CapitalGuard" },
      {
        name: "description",
        content:
          "Track Ghost Debt from wallet resets and margin shortfalls, and watch it shrink with sustained profitable sessions.",
      },
      { property: "og:title", content: "Your Profile & Ghost Debt — CapitalGuard" },
      {
        property: "og:description",
        content: "Your discipline scorecard: ghost debt balance, weekly change and account controls.",
      },
    ],
  }),
  component: Profile,
});

const PILLARS = [
  "Starts at ₹0 for every new user",
  "Grows from wallet resets and margin shortfalls",
  "Shrinks with sustained profitable trading sessions",
];

function Profile() {
  const { ghostDebt, signOut } = useSession();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Back"
          className="flex size-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Your Profile</h1>
      </div>

      <div className="rounded-2xl border border-loss/40 bg-card p-6">
        <div className="flex items-center gap-2">
          <Ghost className="size-5 text-loss" />
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Ghost Debt</p>
        </div>
        <p className="num mt-2 text-4xl font-bold text-loss">{inr(ghostDebt)}</p>
        <span className="num mt-3 inline-block rounded-full bg-profit/15 px-3 py-1 text-xs font-semibold text-profit">
          −{inr(4200)} this week
        </span>
      </div>

      <div className="space-y-3">
        {PILLARS.map((p) => (
          <div key={p} className="rounded-xl border border-border bg-card px-4 py-3 text-sm">
            {p}
          </div>
        ))}
      </div>

      <button
        onClick={signOut}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary py-3 text-sm font-semibold transition-colors hover:bg-accent"
      >
        <LogOut className="size-4" />
        Log out
      </button>
    </div>
  );
}
