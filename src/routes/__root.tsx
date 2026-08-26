import {
  Outlet,
  ScrollRestoration,
  createRootRoute,
  HeadContent,
  Scripts,
  Link,
  useLocation,
} from "@tanstack/react-router";
import appCss from "../styles.css?url";
import {
  ShieldAlert,
  Zap,
  Briefcase,
  Layers,
  Home,
  User,
  BookOpen,
  Lock,
} from "lucide-react";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Capital Guard Shield",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  component: RootComponent,
  notFoundComponent: () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4 text-slate-300">
      <ShieldAlert className="w-12 h-12 text-amber-400" />
      <h2 className="text-xl font-black text-white">Route Not Found</h2>
      <p className="text-xs text-slate-400 max-w-sm">
        The requested screen does not exist. Return to Gateway or F&O Arena.
      </p>
      <Link
        to="/arena"
        className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-black text-xs"
      >
        Go to F&O Arena
      </Link>
    </div>
  ),
});

function RootComponent() {
  return (
    <RootDocument>
      <RootLayout />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body className="bg-[#090d14] text-slate-100 min-h-screen">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { label: "F&O Arena", to: "/arena", icon: Zap },
    { label: "Equity Delivery", to: "/equity", icon: Layers },
    { label: "Unified Positions", to: "/position", icon: Briefcase },
    { label: "Trade Journal", to: "/journal", icon: BookOpen },
    { label: "Gateway & Risk Gate", to: "/", icon: Home },
    { label: "Profile & Broker", to: "/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#090d14] text-slate-100 flex flex-col md:flex-row antialiased">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-[#0e131d] border-r border-[#1c2333] flex flex-col justify-between shrink-0 p-4 space-y-6">
        <div className="space-y-6">
          {/* LOGO & BRAND */}
          <Link to="/" className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black tracking-wider text-white">CAPITALGUARD</div>
              <div className="text-[10px] uppercase tracking-widest text-amber-400 font-bold">Unbreachable Risk</div>
            </div>
          </Link>

          {/* NAV LINKS */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.to;

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:text-white hover:bg-[#161c28]"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* QUICK SWITCH REALM HUD */}
        <div className="p-3 rounded-2xl bg-[#090d14] border border-[#1b2333] space-y-2">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Quick Switch</span>
            <Lock className="w-3 h-3 text-amber-400" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <Link
              to="/equity"
              className={`py-1.5 text-center rounded-lg text-[11px] font-bold transition-all ${
                currentPath === "/equity"
                  ? "bg-emerald-500 text-slate-950 font-black"
                  : "bg-[#151b26] text-slate-400 hover:text-white"
              }`}
            >
              Equity
            </Link>
            <Link
              to="/arena"
              className={`py-1.5 text-center rounded-lg text-[11px] font-bold transition-all ${
                currentPath === "/arena"
                  ? "bg-amber-500 text-slate-950 font-black"
                  : "bg-[#151b26] text-slate-400 hover:text-white"
              }`}
            >
              Arena
            </Link>
          </div>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}

export default RootLayout;