import { createRootRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Zap,
  TrendingUp,
  Briefcase,
  BookOpen,
  UserCheck,
  Shield,
  Clock,
  Radio,
} from "lucide-react";

export const Route = createRootRoute({
  component: RootLayout,
});

function RootLayout() {
  const location = useLocation();
  const [istTime, setIstTime] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      };
      setIstTime(new Intl.DateTimeFormat("en-IN", options).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: "F&O Arena", to: "/arena", icon: Zap, color: "text-amber-400" },
    { name: "Equity Delivery", to: "/equity", icon: TrendingUp, color: "text-emerald-400" },
    { name: "Unified Positions", to: "/position", icon: Briefcase, color: "text-blue-400" },
    { name: "Trade Journal", to: "/journal", icon: BookOpen, color: "text-purple-400" },
    { name: "Profile & Broker", to: "/profile", icon: UserCheck, color: "text-slate-300" },
  ];

  return (
    <div
      style={{ minHeight: "100vh", backgroundColor: "#090d14", display: "flex" }}
      className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col md:flex-row antialiased font-sans"
    >
      {/* SIDEBAR */}
      <aside
        style={{ width: "260px", minWidth: "260px", backgroundColor: "#0c111c", borderRight: "1px solid #1a2336", padding: "16px" }}
        className="w-full md:w-64 bg-[#0c111c] border-r border-[#1a2336] flex flex-col justify-between p-4 shrink-0"
      >
        <div className="space-y-6">
          {/* LOGO & BRAND HEADER */}
          <div className="flex items-center gap-3 px-1 py-1">
            <div
              style={{ width: "40px", height: "40px", minWidth: "40px", minHeight: "40px", overflow: "hidden", borderRadius: "10px" }}
              className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0"
            >
              <img
                src="/logo.png"
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
            <div>
              <div className="font-black text-sm tracking-wider text-white">
                CAPITALGUARD
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
                Unbreachable Risk
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="space-y-1.5 pt-4">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || (item.to === "/arena" && location.pathname === "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/10"
                      : "text-slate-400 hover:text-white hover:bg-[#131a29]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : item.color}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* FOOTER WIDGET */}
        <div className="pt-4 border-t border-[#182133] space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" /> IST
            </span>
            <span className="font-mono text-slate-200">{istTime || "--:--:--"}</span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold">
            <span className="text-slate-400">Angel SmartAPI</span>
            <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <Radio className="w-2.5 h-2.5 animate-pulse" /> Live
            </span>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#090d14]">
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;