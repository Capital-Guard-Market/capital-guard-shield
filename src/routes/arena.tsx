import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { 
  ShieldCheck, 
  Lock, 
  TrendingUp, 
  PieChart, 
  ArrowRight, 
  Flame, 
  Zap, 
  CheckCircle2 
} from "lucide-react";

export const Route = createFileRoute("/arena")({
  component: ArenaGatewayComponent,
});

const SIMULTANEOUS_RISK_TIERS = [
  { label: "Conservative", percent: "0.5%", lossAmount: 25000, desc: "Strict drawdown protection for capital preservation." },
  { label: "Balanced", percent: "1.0%", lossAmount: 50000, desc: "Standard institutional day-trading risk ceiling." },
  { label: "Aggressive", percent: "2.0%", lossAmount: 100000, desc: "High conviction setups across Index & Equity F&O." },
  { label: "Pro Trader", percent: "5.0%", lossAmount: 250000, desc: "Maximum allocated risk ceiling on ₹50 Lakh margin pool." },
];

function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function ArenaGatewayComponent() {
  const navigate = useNavigate();
  const todayKey = getTodayKey();

  const [selectedRealm, setSelectedRealm] = useState<"INVESTMENT" | "FNO" | null>(null);
  const [selectedTier, setSelectedTier] = useState(SIMULTANEOUS_RISK_TIERS[1]); // ₹50,000 default

  const handleEnterInvestments = () => {
    localStorage.setItem("capitalguard_realm", "investment");
    navigate({ to: "/equity" });
  };

  const handleLockFnoGuardrail = () => {
    localStorage.setItem("capitalguard_realm", "fno");
    localStorage.setItem("capitalguard_lock_date", todayKey);
    localStorage.setItem("capitalguard_daily_limit", selectedTier.lossAmount.toString());
    localStorage.setItem("capitalguard_arena", "futures"); // default starting mode
    navigate({ to: "/terminal" });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] p-4 md:p-8 flex flex-col justify-center items-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Brand Header with Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.2)]">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white uppercase tracking-wider">
            CAPITALGUARD
          </h1>
          <p className="text-xs md:text-sm text-slate-400 max-w-md mx-auto">
            Choose your market realm. Institutional discipline with enforced consequence guardrails.
          </p>
        </div>

        {/* Step 1: Choose Realm (Investments vs F&O) */}
        {!selectedRealm ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Realm A: Investments (Home) */}
            <div 
              onClick={handleEnterInvestments}
              className="bg-[#151A23] border-2 border-[#222B3A] hover:border-emerald-500/80 rounded-3xl p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl group"
            >
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 w-fit">
                  <PieChart className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white group-hover:text-emerald-400 transition">
                    Investments &amp; Wealth
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Track cash equity portfolio, create customized watchlists, monitor funds, and compound long-term assets without day-trade lockouts.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#222B3A] mt-6 flex items-center justify-between text-xs font-bold text-emerald-400">
                <span>Enter Investment Home</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

            {/* Realm B: F&O Derivatives Arena */}
            <div 
              onClick={() => setSelectedRealm("FNO")}
              className="bg-[#151A23] border-2 border-amber-500/50 hover:border-amber-400 rounded-3xl p-6 md:p-8 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:scale-[1.02] shadow-xl shadow-amber-500/5 group"
            >
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 w-fit">
                  <Flame className="w-8 h-8" />
                </div>
                <div>
                  <div className="inline-block text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30 mb-2">
                    SIMULTANEOUS RISK SHIELD
                  </div>
                  <h2 className="text-xl font-black text-white group-hover:text-amber-400 transition">
                    F&amp;O Derivatives Arena
                  </h2>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Trade Futures &amp; Options with unified live positions, real-time margin calculations, and an unbreachable daily loss floor locked until 12:00 AM.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-[#222B3A] mt-6 flex items-center justify-between text-xs font-bold text-amber-400">
                <span>Configure Daily Guardrail</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>

          </div>
        ) : (
          /* Step 2: Configure Simultaneous F&O Guardrail */
          <div className="bg-[#151A23] border border-[#222B3A] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222B3A] pb-4">
              <div>
                <div className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>SIMULTANEOUS FUTURES &amp; OPTIONS SHIELD</span>
                </div>
                <h2 className="text-lg font-black text-white mt-1">Set Today&apos;s Combined Loss Floor</h2>
              </div>
              <button
                onClick={() => setSelectedRealm(null)}
                className="text-xs text-slate-400 hover:text-white underline underline-offset-4"
              >
                Back to Selection
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0B0E14] border border-[#222B3A] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Virtual Margin Pool</span>
                <div className="text-2xl font-mono font-black text-emerald-400">₹50,00,000</div>
              </div>
              <p className="text-xs text-slate-400 text-center sm:text-right max-w-xs">
                This floor simultaneously bounds your total downside across <b>both Futures &amp; Options</b> until midnight.
              </p>
            </div>

            {/* Risk Tiers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SIMULTANEOUS_RISK_TIERS.map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    selectedTier.label === tier.label
                      ? "bg-amber-500/10 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.15)]"
                      : "bg-[#0B0E14] border-[#222B3A] hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{tier.label} ({tier.percent})</span>
                    <span className="text-xs font-mono font-bold text-rose-400">₹{tier.lossAmount.toLocaleString("en-IN")} Floor</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{tier.desc}</p>
                </button>
              ))}
            </div>

            {/* Lock Button */}
            <button
              onClick={handleLockFnoGuardrail}
              className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-400/20 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Lock ₹{selectedTier.lossAmount.toLocaleString("en-IN")} Shield &amp; Enter F&amp;O Terminal</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}