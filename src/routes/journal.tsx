import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/journal")({
  head: () => ({
    meta: [
      { title: "Journal Calendar — CapitalGuard" },
      {
        name: "description",
        content: "A month view of green days, red days and shield lockouts to spot bad habits.",
      },
      { property: "og:title", content: "Journal Calendar — CapitalGuard" },
      {
        property: "og:description",
        content: "Discipline heatmap of your simulated trading month.",
      },
    ],
  }),
  component: Journal,
});

type Day = { d: number; pnl: number | null; shield?: boolean };

const DAYS: Day[] = Array.from({ length: 31 }, (_, i) => {
  const d = i + 1;
  if (d > 21) return { d, pnl: null };
  const seed = (d * 37) % 11;
  if (seed === 0) return { d, pnl: -9000, shield: true };
  if (d % 7 === 0 || d % 7 === 6) return { d, pnl: null };
  return { d, pnl: (seed - 4) * 1450 };
});

function Journal() {
  const green = DAYS.filter((x) => (x.pnl ?? 0) > 0).length;
  const red = DAYS.filter((x) => (x.pnl ?? 0) < 0).length;
  const shields = DAYS.filter((x) => x.shield).length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold tracking-tight">Journal calendar</h1>

      <div className="grid grid-cols-3 gap-3">
        {[
          ["Green days", green, "text-profit"],
          ["Red days", red, "text-loss"],
          ["Shield days", shields, "text-primary"],
        ].map(([label, val, cls]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className={`num mt-1 text-2xl font-bold ${cls}`}>{val}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="num grid grid-cols-7 gap-2 text-center text-[11px] text-muted-foreground">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-2">
          {DAYS.map((day) => {
            const cls = day.shield
              ? "border-primary/60 bg-primary/15 text-primary"
              : day.pnl === null
                ? "border-border bg-secondary/40 text-muted-foreground"
                : day.pnl > 0
                  ? "border-profit/40 bg-profit/15 text-profit"
                  : "border-loss/40 bg-loss/15 text-loss";
            return (
              <div
                key={day.d}
                className={`num flex aspect-square flex-col items-center justify-center rounded-lg border text-[11px] ${cls}`}
              >
                <span className="font-semibold">{day.d}</span>
                {day.pnl !== null && (
                  <span className="text-[9px]">
                    {day.pnl > 0 ? "+" : "-"}
                    {Math.abs(Math.round(day.pnl / 100) / 10)}k
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
