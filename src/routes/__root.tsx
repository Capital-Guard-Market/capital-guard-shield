import "../styles.css";
import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
  useLocation,
} from "@tanstack/react-router";
import { TrendingUp, User, Bookmark, Briefcase } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { SessionProvider } from "@/lib/session";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CapitalGuard — Risk & Discipline Terminal" },
      { name: "theme-color", content: "#0B0E14" },
    ],
    links: [
      { rel: "icon", href: "/logo.png" },
      { rel: "apple-touch-icon", href: "/logo.png" },
    ],
  }),
  shellComponent: RootDocument,
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-background text-foreground antialiased">
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const location = useLocation();
  const [openCount, setOpenCount] = useState(0);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (!sessionStorage.getItem("capitalguard_splash_seen")) setShowSplash(true);
  }, []);

  const handleSplashFinish = () => {
    sessionStorage.setItem("capitalguard_splash_seen", "true");
    setShowSplash(false);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_positions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setOpenCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {
      /* ignore */
    }
  }, [location.pathname]);

  const navItems = [
    { label: "Terminal", to: "/terminal", icon: TrendingUp, badge: null as number | null },
    {
      label: "Positions",
      to: "/position",
      icon: Briefcase,
      badge: openCount > 0 ? openCount : null,
    },
    { label: "Watchlist", to: "/arena", icon: Bookmark, badge: null as number | null },
    { label: "Profile", to: "/profile", icon: User, badge: null as number | null },
  ];

  return (
    <SessionProvider>
    <div className="flex min-h-screen flex-col justify-between bg-background font-sans text-foreground selection:bg-primary selection:text-primary-foreground">
      {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg border-t border-border bg-card/95 px-6 py-2 backdrop-blur-md sm:rounded-t-2xl">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`relative flex flex-col items-center gap-1 rounded-xl px-3 py-1 transition-all ${
                  isActive
                    ? "font-bold text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <Icon className="size-5" />
                  {item.badge && (
                    <span className="num absolute -top-1.5 -right-2.5 rounded-full bg-profit px-1.5 text-[9px] font-extrabold text-background ring-2 ring-card">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] tracking-tight">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
    </SessionProvider>
  );
}
