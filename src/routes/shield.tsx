import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { inr, useSession } from "@/lib/session";

export const Route = createFileRoute("/shield")({
  head: () => ({
    meta: [
      { title: "Shield Active — CapitalGuard" },
      {
        name: "description",
        content:
          "Trading is locked for the rest of the day. Your remaining virtual capital is protected.",
      },
      { property: "og:title", content: "Shield Active — CapitalGuard" },
      {
        property: "og:description",
        content: "The daily loss limit was hit — all order entry is disabled until midnight.",
      },
    ],
  }),
  component: ShieldPage,
});

function useMidnightCountdown() {
  const [left, setLeft] = useState("--:--:--");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const mid = new Date(now);
      mid.setHours(24, 0, 0, 0);
      const d = mid.getTime() - now.getTime();
      const h = Math.floor(d / 3600000);
      const m = Math.floor((d % 3600000) / 60000);
      const s = Math.floor((d % 60000) / 1000);
      setLeft(`${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return left;
}

function ShieldPage() {
  const { locked, capitalSaved, resetSession } = useSession();
  const navigate = useNavigate();
  const countdown = useMidnightCountdown();

  useEffect(() => {
    if (!locked) navigate({ to: "/" });
  }, [locked, navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background px-6 text-center">
      <ShieldCheck className="shield-pulse size-24 text-primary" />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">Shield Active</h1>
      <p className="mt-2 text-sm text-muted-foreground">Your remaining capital is safe.</p>

      <div className="mt-8 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Capital saved today
        </p>
        <p className="num mt-1 text-3xl font-bold text-profit">{inr(capitalSaved || 9000)}</p>
      </div>

      <div className="mt-4 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Trading resumes in
        </p>
        <p className="num mt-1 text-2xl font-bold text-primary">{countdown}</p>
      </div>

      <p className="mt-6 max-w-sm text-xs text-muted-foreground">
        All buy and sell controls are disabled until midnight. Tomorrow you start with a fresh
        risk gate.
      </p>

      <button
        onClick={() => {
          resetSession();
          navigate({ to: "/" });
        }}
        className="mt-8 rounded-xl border border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Reset demo session
      </button>
    </div>
  );
}
