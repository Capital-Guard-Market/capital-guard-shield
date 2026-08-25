import { createRootRoute, Outlet, Link, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import { TrendingUp, User, Bookmark, Briefcase, ShieldCheck, Lock } from "lucide-react";
import React, { createContext, useContext, useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";

// 🛡️ Self-contained Session Context (Prevents any missing file/import errors on Vercel)
interface UserType {
  id: string;
  email: string;
  name: string;
}

interface SessionContextType {
  user: UserType | null;
  session: any | null;
  loading: boolean;
  login: (email?: string) => void;
  logout: () => void;
}

const defaultSession: SessionContextType = {
  user: { id: "trader_1", email: "trader@capitalguard.io", name: "Pro Trader" },
  session: { access_token: "mock_token" },
  loading: false,
  login: () => {},
  logout: () => {},
};

export const SessionContext = createContext<SessionContextType>(defaultSession);

export function useSession(): SessionContextType {
  const context = useContext(SessionContext);
  return context || defaultSession;
}

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>({
    id: "trader_1",
    email: "trader@capitalguard.io",
    name: "Pro Trader",
  });
  const [session, setSession] = useState<any | null>({ access_token: "mock_token" });
  const [loading] = useState(false);

  const login = (email = "trader@capitalguard.io") => {
    setUser({ id: "trader_1", email, name: email.split("@")[0] });
    setSession({ access_token: "mock_token" });
  };

  const logout = () => {
    setUser(null);
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ user, session, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { title: "CapitalGuard 🛡️ Unbreachable Risk Engine" },
    ],
    scripts: [
      { src: "https://cdn.tailwindcss.com" }
    ]
  }),
  component: RootDocument,
});

function RootDocument() {
  const location = useLocation();
  const [openCount, setOpenCount] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [activeArena, setActiveArena] = useState("options");

  useEffect(() => {
    const hasSeenSplash = sessionStorage.getItem("capitalguard_splash_seen");
    if (hasSeenSplash) {
      setShowSplash(false);
    }
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
        const openTrades = Array.isArray(parsed) ? parsed.filter((p: any) => p.status !== "CLOSED") : [];
        setOpenCount(openTrades.length);
      }
      const arena = localStorage.getItem("capitalguard_arena") || "options";
      setActiveArena(arena);
    } catch (e) {}
  }, [location.pathname]);

  const navItems = [
    { label: "Terminal", to: "/terminal", icon: TrendingUp },
    { label: "Positions", to: "/position", icon: Briefcase, badge: openCount > 0 ? openCount : null },
    { label: "Arenas & Risk", to: "/arena", icon: Bookmark },
    { label: "Profile", to: "/profile", icon: User },
  ];

  return (
    <html lang="en" className="dark bg-[#0B0E14]">
      <head>
        <HeadContent />
        <script src="https://cdn.tailwindcss.com"></script>
        <style dangerouslySetInnerHTML={{ __html: `
          body {
            margin: 0;
            background-color: #0B0E14;
            color: #F1F5F9;
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            -webkit-tap-highlight-color: transparent;
          }
        `}} />
      </head>
      <body className="bg-[#0B0E14] text-slate-100 min-h-screen font-sans selection:bg-amber-400 selection:text-slate-950">
        <SessionProvider>
          {showSplash && <SplashScreen onFinish={handleSplashFinish} />}

          <div className="flex flex-col md:flex-row min-h-screen">
            {/* 🖥️ DESKTOP LEFT VERTICAL SIDEBAR */}
            <aside className="hidden md:flex flex-col w-64 bg-[#151A23] border-r border-[#222B3A] p-5 shrink-0 fixed inset-y-0 left-0 z-30 justify-between">
              <div className="space-y-6">
                {/* Logo */}
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-black tracking-wider text-sm text-white uppercase">CapitalGuard</h1>
                    <p className="text-[10px] text-amber-400 font-mono font-bold tracking-tight">UNBREACHABLE SHIELD</p>
                  </div>
                </div>

                {/* Nav Links */}
                <nav className="space-y-1.5">
                  {navItems.map((item) => {
                    const isActive = location.pathname === item.to;
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.to}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? "bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20"
                            : "text-slate-400 hover:text-white hover:bg-[#0B0E14]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-4 h-4" />
                          <span>{item.label}</span>
                        </div>
                        {item.badge && (
                          <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isActive ? "bg-slate-950 text-amber-400" : "bg-emerald-500 text-slate-950"
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              {/* Mode Lock Footer */}
              <div className="bg-[#0B0E14] border border-[#222B3A] rounded-xl p-3.5 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-400 text-[11px] font-bold">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Guardrail Shield Active</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Mode: <span className="text-white font-semibold capitalize">{activeArena} Arena</span>
                </p>
                <p className="text-[9px] text-slate-500 font-mono">Floor locked until 12:00 AM</p>
              </div>
            </aside>

            {/* 📱 MAIN CONTENT */}
            <main className="flex-1 md:pl-64 w-full min-h-screen pb-28 md:pb-8">
              <Outlet />
            </main>

            {/* 📱 MOBILE BOTTOM DOCK */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#151A23]/95 backdrop-blur-md border-t border-[#222B3A] py-2 px-6 max-w-lg mx-auto">
              <div className="flex justify-around items-center">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`flex flex-col items-center space-y-1 relative py-1 px-3 rounded-xl transition-all ${
                        isActive ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      <div className="relative">
                        <Icon className={`w-5 h-5 ${isActive ? "text-amber-400" : "text-slate-400"}`} />
                        {item.badge && (
                          <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full ring-2 ring-[#151A23]">
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

        <Scripts />
      </body>
    </html>
  );
}