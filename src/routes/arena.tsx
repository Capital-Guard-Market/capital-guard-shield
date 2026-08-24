import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Shield, Zap, TrendingUp, ArrowRight, Lock, CheckCircle2, RotateCcw } from "lucide-react";
import { useSession } from "@/lib/session";

export const Route = createFileRoute("/arena")({
  head: () => ({
    meta: [{ title: "Choose Arena 🛡️ CapitalGuard" }],
  }),
  component: ArenaSelect,
});

export function ArenaSelect() {
  const navigate = useNavigate();
  const session = useSession();

  const [hasExistingGuardrail, setHasExistingGuardrail] = useState(false);
  const [lossLimit, setLossLimit] = useState<number>(5000);
  const [isEditingLimit, setIsEditingLimit] = useState(false);

  useEffect(() => {
    const savedLimit = localStorage.getItem("capitalguard_guardrail_limit");
    if (savedLimit) {
      setLossLimit(Number(savedLimit));
      setHasExistingGuardrail(true);
    }
  }, []);

  const handleSelectArena = (arenaType: "options" | "futures") => {
    localStorage.setItem("capitalguard_arena", arenaType);
    localStorage.setItem("capitalguard_guardrail_limit", lossLimit.toString());
    navigate({ to: "/terminal" });
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] text-slate-100 p-4 sm:p-6 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-amber-400/10 border border-amber-400/30 rounded-full text-amber-400 text-xs font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>CAPITALGUARD RISK ENGINE</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Select Your Trading Arena</h1>
          <p className="text-xs text-slate-400">Switch arenas seamlessly under your active risk shield.</p>
        </div>

        {/* Active Shield Guardrail Card */}
        <div className="p-4 bg-[#151A23] border border-[#222B3A] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Daily Guardrail Shield</span>
            </div>
            <button
              onClick={() => setIsEditingLimit(!isEditingLimit)}
              className="text-[11px] text-amber-400 hover:underline font-semibold"
            >
              {isEditingLimit ? "Lock Limit" : "Adjust Limit"}
            </button>
          </div>

          {isEditingLimit ? (
            <div className="pt-2">
              <label className="text-[10px] text-slate-400 uppercase font-bold">Set Daily Max Loss Buffer (₹)</label>
              <input
                type="number"
                value={lossLimit}
                onChange={(e) => setLossLimit(Math.max(500, Number(e.target.value)))}
                className="w-full mt-1.5 px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
              <span>Active Daily Loss Floor:</span>
              <span className="text-amber-400 font-bold text-sm">₹{lossLimit.toLocaleString("en-IN")}</span>
            </div>
          )}
        </div>

        {/* Arena Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Options Arena */}
          <button
            onClick={() => handleSelectArena("options")}
            className="p-5 bg-[#151A23] border border-[#222B3A] hover:border-amber-400 rounded-2xl text-left space-y-3 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="p-2.5 bg-amber-400/10 text-amber-400 rounded-xl w-fit group-hover:bg-amber-400 group-hover:text-slate-950 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Options Arena</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Index & Stock Options trading with upfront premium allocation and gamma volatility protection.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-amber-400">
              <span>Virtual Capital: ₹10 Lakh</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>

          {/* Futures Arena */}
          <button
            onClick={() => handleSelectArena("futures")}
            className="p-5 bg-[#151A23] border border-[#222B3A] hover:border-cyan-400 rounded-2xl text-left space-y-3 transition-all hover:scale-[1.02] active:scale-[0.98] group"
          >
            <div className="p-2.5 bg-cyan-400/10 text-cyan-400 rounded-xl w-fit group-hover:bg-cyan-400 group-hover:text-slate-950 transition-colors">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Futures Arena</h3>
              <p className="text-[11px] text-slate-400 mt-1">
                High-leverage multi-lot futures with SPAN margin tracking and linear tick precision.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-between text-xs font-bold text-cyan-400">
              <span>Virtual Capital: ₹50 Lakh</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>

        <div className="text-center pt-2">
          <Link to="/profile" className="text-xs text-slate-400 hover:text-white underline">
            Go to Profile & Personal Journal →
          </Link>
        </div>
      </div>
    </div>
  );
}