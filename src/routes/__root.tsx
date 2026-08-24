import { createRootRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { TrendingUp, Layers, User, Bookmark, Briefcase } from "lucide-react";
import { useEffect, useState } from "react";

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  const location = useLocation();
  const [openCount, setOpenCount] = useState(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("capitalguard_positions");
      if (saved) {
        const parsed = JSON.parse(saved);
        setOpenCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch (e) {}
  }, [location.pathname]);

  const navItems = [
    { label: "Terminal", to: "/terminal", icon: TrendingUp },
    { label: "Positions", to: "/position", icon: Briefcase, badge: openCount > 0 ? openCount : null },
    { label: "Watchlist", to: "/arena", icon: Bookmark },
    { label: "Profile", to: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 flex flex-col justify-between font-sans selection:bg-amber-400 selection:text-slate-950">
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Unified Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#151A23]/95 backdrop-blur-md border-t border-[#222B3A] py-2 px-6 max-w-lg mx-auto sm:rounded-t-2xl">
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
  );
}