import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  Phone, 
  Wallet, 
  Ghost, 
  HelpCircle, 
  LogOut, 
  BookOpen, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft,
  FileText,
  TrendingUp,
  BrainCircuit,
  Info
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [{ title: "User Profile & Journal 🛡️ CapitalGuard" }],
  }),
  component: ProfilePage,
});

export function ProfilePage() {
  const navigate = useNavigate();

  // Active user details
  const [profile, setProfile] = useState({
    name: "Govind Thakur",
    email: "govind.thakur@capitalguard.internal",
    phone: "+91 98765 43210",
  });

  const [activeTab, setActiveTab] = useState<"overview" | "journal" | "academics">("overview");

  // Load trade journal from closed positions
  const [journalTrades, setJournalTrades] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem("capitalguard_closed_positions");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleLogout = () => {
    localStorage.clear();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 sm:p-6 pb-28">
      <div className="max-w-3xl mx-auto space-y-5">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222B3A]">
          <Link to="/terminal" className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Terminal</span>
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* User Card */}
        <div className="p-5 bg-[#151A23] border border-[#222B3A] rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-lg">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">{profile.name}</h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-0.5">
                <span className="flex items-center space-x-1"><Mail className="w-3 h-3 text-slate-500" /> <span>{profile.email}</span></span>
                <span className="flex items-center space-x-1"><Phone className="w-3 h-3 text-slate-500" /> <span>{profile.phone}</span></span>
              </div>
            </div>
          </div>
        </div>

        {/* Capital Leftover & Ghost Debt Metrics Card (Normal Font) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <Wallet className="w-4 h-4 text-emerald-400" />
                <span>Capitals Leftover</span>
              </span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-medium">Available</span>
            </div>
            {/* Value in clean normal font */}
            <p className="text-sm font-normal text-slate-200 pt-1">
              ₹8,45,200.00 / ₹10,00,000 (Options Arena)
            </p>
          </div>

          <div className="p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center space-x-1.5 font-medium">
                <Ghost className="w-4 h-4 text-slate-400" />
                <span>Ghost Debt</span>
              </span>
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded font-medium">Zero Exposure</span>
            </div>
            {/* Value in normal font */}
            <p className="text-sm font-normal text-slate-300 pt-1">
              ₹0.00 (Protected by Hard Guardrail Shield)
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 p-1 bg-[#151A23] border border-[#222B3A] rounded-xl text-xs font-bold">
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex-1 py-2 rounded-lg transition-all ${activeTab === "overview" ? "bg-amber-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"}`}
          >
            About Shield
          </button>
          <button
            onClick={() => setActiveTab("journal")}
            className={`flex-1 py-2 rounded-lg transition-all ${activeTab === "journal" ? "bg-amber-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"}`}
          >
            Trading Journal ({journalTrades.length})
          </button>
          <button
            onClick={() => setActiveTab("academics")}
            className={`flex-1 py-2 rounded-lg transition-all ${activeTab === "academics" ? "bg-amber-400 text-slate-950 shadow" : "text-slate-400 hover:text-white"}`}
          >
            Academics
          </button>
        </div>

        {/* TAB 1: ABOUT CAPITALGUARD & IMPORTANCE */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="p-5 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-3 text-xs leading-relaxed text-slate-300">
              <div className="flex items-center space-x-2 text-sm font-bold text-white">
                <Info className="w-4 h-4 text-amber-400" />
                <span>About CapitalGuard & Its Importance</span>
              </div>
              <p>
                In retail derivatives (F&O) trading, over 93% of capital loss occurs due to emotional revenge trading, failing to cut losers, and over-leveraging beyond risk tolerance.
              </p>
              <p>
                <strong>CapitalGuard</strong> operates as an unbreachable psychological firewall. By mandating hard stop-losses, calculating SPAN margins in real-time, and enforcing strict daily guardrails, the platform prevents account blow-outs and builds systematic market discipline.
              </p>
            </div>

            {/* Support Box */}
            <div className="p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-slate-200">Need Guidance or Support?</span>
              </div>
              <a
                href="mailto:support@capitalguard.internal"
                className="px-3 py-1.5 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg text-[11px] font-bold text-slate-200"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: EMBEDDED TRADING JOURNAL */}
        {activeTab === "journal" && (
          <div className="p-5 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#222B3A] pb-3">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Trade History & Execution Journal</h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{journalTrades.length} Recorded Trades</span>
            </div>

            {journalTrades.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-8">No closed trades recorded in the journal today.</p>
            ) : (
              <div className="space-y-2">
                {journalTrades.map((trade, idx) => (
                  <div key={idx} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{trade.symbol}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {trade.quantity} Qty • Entry: ₹{trade.entryPrice} • Exit: ₹{trade.exitPrice} ({trade.exitTimestamp})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-mono font-bold ${trade.realizedPnL >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {trade.realizedPnL >= 0 ? "+" : ""}₹{trade.realizedPnL?.toFixed(2)}
                      </span>
                      <span className="block text-[9px] text-slate-500">Discipline Score: {trade.postMortem?.disciplineScore || 90}/100</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ACADEMICS (LOADING ANIMATION / MODULES) */}
        {activeTab === "academics" && (
          <div className="p-8 bg-[#151A23] border border-[#222B3A] rounded-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">Academics Curriculum Loading...</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Syncing institutional risk modeling lessons, delta hedging modules, and option Greeks masterclasses.
              </p>
            </div>
            <div className="pt-2">
              <span className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-400">
                MODULE 1: STOP-LOSS PSYCHOLOGY (85% READY)
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}