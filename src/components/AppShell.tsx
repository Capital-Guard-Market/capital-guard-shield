import { Link } from "@tanstack/react-router";
import { CalendarDays, LineChart, ShieldHalf, Star, User } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { to: "/", label: "Terminal", icon: LineChart },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/journal", label: "Journal", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <ShieldHalf className="size-5 text-primary" />
            <span className="text-sm font-semibold tracking-tight">CapitalGuard</span>
          </Link>
          <span className="num text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Practice with consequences
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-3xl grid-cols-4">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-1 py-3 text-[11px] text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
