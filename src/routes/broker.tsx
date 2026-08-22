import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Lock } from "lucide-react";

export const Route = createFileRoute("/broker")({
  head: () => ({
    meta: [
      { title: "Connect Broker — CapitalGuard" },
      {
        name: "description",
        content:
          "Link your broker account to stream live prices into CapitalGuard. Data only — no real orders are ever placed.",
      },
      { property: "og:title", content: "Connect Broker — CapitalGuard" },
      {
        property: "og:description",
        content: "Zerodha, Angel One, Groww, Upstox, Dhan, Fyers or Shoonya — data-only linking.",
      },
    ],
  }),
  component: BrokerPage,
});

const BROKERS = [
  "Zerodha",
  "Angel One",
  "Groww",
  "Upstox",
  "Dhan",
  "Fyers",
  "Shoonya",
] as const;

function BrokerPage() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (b: string) => {
    setPicked(b);
    setTimeout(() => navigate({ to: "/arena" }), 280);
  };

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
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Step 1 of 4</p>
          <h1 className="text-2xl font-semibold tracking-tight">Connect Broker</h1>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Link your broker account to stream live prices. It&apos;s just for data — no real orders
        placed.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {BROKERS.map((b) => (
          <button
            key={b}
            onClick={() => choose(b)}
            className={`rounded-2xl border bg-card p-4 text-left text-sm font-semibold transition-colors ${
              picked === b ? "border-primary glow-ring text-primary" : "border-border hover:border-primary/60"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" />
        You log in on the broker&apos;s own page. CapitalGuard never sees your password.
      </p>
    </div>
  );
}
