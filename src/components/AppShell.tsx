import { Link, useRouterState } from "@tanstack/react-router";
import { CalendarDays, Home, LineChart, LogOut, Star, User } from "lucide-react";
import type { ReactNode } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "@/lib/session";
import { LoginScreen } from "@/components/LoginScreen";

const NAV = [
  { to: "/", label: "Terminal", icon: LineChart },
  { to: "/watchlist", label: "Watchlist", icon: Star },
  { to: "/journal", label: "Journal", icon: CalendarDays },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user, hydrated, signOut } = useSession();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!hydrated) return <div className="min-h-screen bg-background" />;
  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto grid h-14 max-w-3xl grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-3 px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <img src="/logo.png" alt="CapitalGuard" className="h-8 w-auto shrink-0 rounded" />
            <span className="truncate bg-gradient-to-b from-white via-slate-200 to-slate-400 bg-clip-text text-sm font-bold tracking-tight text-transparent">
              CapitalGuard
            </span>
          </Link>

          {pathname !== "/" && (
            <Link
              to="/"
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              <Home className="size-4" />
              Switch mode
            </Link>
          )}

          <Link
            to="/profile"
            aria-label="Your profile"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-primary"
          >
            <User className="size-4" />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className="num flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-xs font-bold text-primary"
            >
              {user.avatar}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="text-sm font-semibold">{user.name}</p>
                <p className="num text-xs font-normal text-muted-foreground">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut()}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
