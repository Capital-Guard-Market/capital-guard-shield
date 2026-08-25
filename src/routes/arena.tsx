import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ShieldCheck, TrendingUp, Zap, Sliders, CheckCircle2, ChevronRight, X, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/arena")({
  component: ArenaComponent,
});

const FUTURES_CAPITAL = 5000000; // ₹50,00,000 Base Capital

const OPTIONS_TIERS = [
  { label: "₹5,000", sublabel: "Conservative", value: 5000 },
  { label: "₹10,000", sublabel: "Moderate", value: 10000 },
  { label: "₹20,000", sublabel: "Aggressive", value: 20000 },
];

const FUTURES_TIERS = [
  { label: "5%", sublabel: "₹2,50,000 Risk", value: 250000 },
  { label: "10%", sublabel: "₹5,00,000 Risk", value: 500000 },
  { label: "20%", sublabel: "₹10,00,000 Risk", value: 1000000 },
];

function ArenaComponent() {
  const navigate = useNavigate();
  const [selectedArena, setSelectedArena] = useState<"options" | "futures">("options");
  const [dailyLimit, setDailyLimit] = useState<number>(5000);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load saved preferences
  useEffect(() => {
    try {
      const savedArena = localStorage.getItem("capitalguard_arena");
      if (savedArena === "options" || savedArena === "futures") {
        setSelectedArena(savedArena);
      }
      const savedLimit = localStorage.getItem("capitalguard_daily_limit");
      if (savedLimit) {
        setDailyLimit(Number(savedLimit));
      } else {
        setDailyLimit(savedArena === "futures" ? 250000 : 5000);
      }
    } catch (e) {}
  }, []);

  // Handle Arena Switch
  const handleArenaChange = (arena: "options" | "futures") => {
    setSelectedArena(arena);
    const defaultLimit = arena === "options" ? 5000 : 250000;
    setDailyLimit(defaultLimit);
    localStorage.setItem("capitalguard_arena", arena);
    localStorage.setItem("capitalguard_daily_limit", defaultLimit.toString());
  };

  // Handle Tier Select
  const handleSelectLimit = (val: number) => {
    setDailyLimit(val);
    localStorage.setItem("capitalguard_daily_limit", val.toString());
    setIsModalOpen(false);
  };

  const activeTiers = selectedArena === "options" ? OPTIONS_TIERS : FUTURES_TIERS;

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 pb-28 max-w-xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center pt-4 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5" />
          CapitalGuard Risk Engine
        </div>
        <h1 className="text-2xl font-black tracking-tight text-white">Select Your Trading Arena</h1>
        <p className="text-xs text-slate-400">Switch arenas seamlessly under your active risk shield.</p>
      </div>

      {/* Active Daily Loss Floor Card */}
      <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
            <CheckCircle2 className="w-4 h-4" />
            <span>Daily Guardrail Shield</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline underline-offset-4 flex items-center gap-1 transition"
          >
            <Sliders className="w-3 h-3" />
            Adjust Limit
          </button>
        </div>

        <div className="bg-[#0B0E14]/80 border border-[#222B3A] rounded-xl p-3 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block">Active Daily Loss Floor:</span>
            {selectedArena === "futures" && (
              <span className="text-[10px] text-slate-500 font-mono">
                Base Capital: ₹{FUTURES_CAPITAL.toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <span className="text-lg font-mono font-black text-amber-400">
            ₹{dailyLimit.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Arena Selection Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 px-1">Choose Arena</h2>

        {/* Options Arena Card */}
        <div
          onClick={() => handleArenaChange("options")}
          className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
            selectedArena === "options"
              ? "bg-amber-500/10 border-amber-500/60 shadow-[0_0_20px_rgba(251,191,36,0.15)]"
              : "bg-[#151A23] border-[#222B3A] hover:border-slate-700 opacity-70"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">F&O Options Arena</h3>
                <p className="text-xs text-slate-400">Index & Stock Options trading with fixed ₹ loss limits.</p>
              </div>
            </div>
            {selectedArena === "options" && <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />}
          </div>

          <div className="mt-4 pt-3 border-t border-[#222B3A]/60 flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Floor Tiers:</span>
            <span className="text-amber-400 font-semibold">₹5,000 | ₹10,000 | ₹20,000</span>
          </div>
        </div>

        {/* Futures Arena Card */}
        <div
          onClick={() => handleArenaChange("futures")}
          className={`cursor-pointer rounded-2xl p-4 border transition-all relative overflow-hidden ${
            selectedArena === "futures"
              ? "bg-emerald-500/10 border-emerald-500/60 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
              : "bg-[#151A23] border-[#222B3A] hover:border-slate-700 opacity-70"
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Futures Arena</h3>
                <p className="text-xs text-slate-400">Stock & Index Futures bound to ₹50L portfolio capital.</p>
              </div>
            </div>
            {selectedArena === "futures" && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
          </div>

          <div className="mt-4 pt-3 border-t border-[#222B3A]/60 flex items-center justify-between text-xs font-mono text-slate-300">
            <span>Portfolio Risk Tiers:</span>
            <span className="text-emerald-400 font-semibold">5% (₹2.5L) | 10% (₹5L) | 20% (₹10L)</span>
          </div>
        </div>
      </div>

      {/* Enter Terminal Action Button */}
      <button
        onClick={() => navigate({ to: "/terminal" })}
        className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition"
      >
        <span>Enter {selectedArena === "options" ? "Options" : "Futures"} Terminal</span>
        <ChevronRight className="w-4 h-4 stroke-[3]" />
      </button>

      {/* Adjust Limit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#151A23] border border-[#222B3A] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Select Daily Loss Limit</span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              {selectedArena === "options"
                ? "Select an absolute intraday loss ceiling for Options:"
                : "Select risk percentage on ₹50,00,000 Futures capital base:"}
            </p>

            <div className="space-y-2">
              {activeTiers.map((tier) => (
                <button
                  key={tier.value}
                  onClick={() => handleSelectLimit(tier.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition ${
                    dailyLimit === tier.value
                      ? "bg-amber-400/10 border-amber-400 text-amber-400 font-bold"
                      : "bg-[#0B0E14] border-[#222B3A] text-slate-300 hover:border-slate-600"
                  }`}
                >
                  <span className="font-mono text-base">{tier.label}</span>
                  <span className="text-xs text-slate-400 font-sans">{tier.sublabel}</span>
                </button>
              ))}
            </div>

            <div className="pt-2 flex items-center gap-2 text-[11px] text-slate-500 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Breaching this floor activates mandatory terminal lockout.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}