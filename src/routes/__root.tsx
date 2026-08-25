import { createRootRoute, Outlet, Link, useLocation, HeadContent, Scripts } from "@tanstack/react-router";
import { TrendingUp, User, Bookmark, Briefcase, ShieldCheck, Lock, PieChart, Flame } from "lucide-react";
import { useEffect, useState } from "react";
import { SplashScreen } from "@/components/SplashScreen";
import { SessionProvider } from "@/hooks/useSession";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" },
      { title: "CapitalGuard 🛡️ Institutional Risk & Investment Terminal" },
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
    } catch (e) {}
  }, [location.pathname]);

  const navItems = [
    { label: "F&O Terminal", to: "/terminal", icon: TrendingUp },
    { label: "Positions (Unified)", to: "/position", icon: Briefcase, badge: openCount > 0 ? openCount : null },
    { label: "Investments (Home)", to: "/equity", icon: PieChart },
    { label: "Gateway & Arenas", to: "/arena", icon: Bookmark },
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
            
            {/* 🖥️ DESKTOP LEFT VERTICAL SIDEBAR WITH LOGO */}
            <aside className="hidden md:flex flex-col w-64 bg-[#151A23] border-r border-[#222B3A] p-5 shrink-0 fixed inset-y-0 left-0 z-30 justify-between">
              <div className="space-y-6">
                
                {/* Brand Logo & Wordmark */}
                <div className="flex items-center gap-3 px-2 py-1">
                  <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h1 className="font-black tracking-wider text-sm text-white uppercase">CAPITALGUARD</h1>
                    <p className="text-[10px] text-amber-400 font-mono font-bold tracking-tight">UNBREACHABLE RISK</p>
                  </div>
                </div>

                {/* Navigation Items */}
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

              {/* Bottom Quick Switch Mode Card */}
              <div className="bg-[#0B0E14] border border-[#222B3A] rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                  <span>QUICK SWITCH REALM</span>
                  <Lock className="w-3 h-3 text-amber-400" />
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <Link
                    to="/equity"
                    className="py-2 rounded-lg bg-[#151A23] hover:border-emerald-400 border border-[#222B3A] text-center text-[10px] font-bold text-emerald-400 flex items-center justify-center gap-1"
                  >
                    <PieChart className="w-3 h-3" />
                    <span>Home</span>
                  </Link>
                  <Link
                    to="/terminal"
                    className="py-2 rounded-lg bg-[#151A23] hover:border-amber-400 border border-[#222B3A] text-center text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1"
                  >
                    <Flame className="w-3 h-3" />
                    <span>Arena</span>
                  </Link>
                </div>
              </div>
            </aside>

            {/* 📱 MAIN CONTENT OUTLET */}
            <main className="flex-1 md:pl-64 w-full min-h-screen pb-28 md:pb-8">
              <Outlet />
            </main>

            {/* 📱 MOBILE BOTTOM DOCK */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#151A23]/95 backdrop-blur-md border-t border-[#222B3A] py-2 px-4 max-w-lg mx-auto">
              <div className="flex justify-around items-center">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.to;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      to={item.to}
                      className={`flex flex-col items-center space-y-1 relative py-1 px-2.5 rounded-xl transition-all ${
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
                      <span className="text-[9px] tracking-tight">{item.label.split(" ")[0]}</span>
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